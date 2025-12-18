import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { exampleImages } from "@/data/exampleImages";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { refresh: refreshUser } = useAuth();
  
  // Check for generation intent immediately
  const hasV2Intent = typeof window !== "undefined" && !!localStorage.getItem("dashboardV2_generationIntent");
  const hasV3Intent = typeof window !== "undefined" && !!localStorage.getItem("dashboardV3_generationIntent");
  const hasAnyGenerationIntent = hasV2Intent || hasV3Intent;
  
  const [hasPage2FormData, setHasPage2FormData] = useState(false);
  const [hasPage3FormData, setHasPage3FormData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(hasAnyGenerationIntent);
  const [statusMessage, setStatusMessage] = useState("Processing payment...");
  const hasProcessedGeneration = useRef(false);
  
  const generateFromPage2Mutation = trpc.photo.generateFromPage2.useMutation();
  const uploadPage2ImagesMutation = trpc.photo.uploadPage2Images.useMutation();
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();
  const generateMutation = trpc.photo.generate.useMutation();
  
  // NEW: Mutation to verify payment and add credits directly
  const verifyPaymentMutation = trpc.payment.verifyPaymentAndAddCredits.useMutation();
  
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("session_id");
  }, []);

  // Track Reddit conversion on payment success
  useEffect(() => {
    if (sessionId && typeof window !== "undefined" && (window as any).rdt) {
      try {
        (window as any).rdt('track', 'Purchase', {
          conversionId: sessionId
        });
        console.log('[Reddit Pixel] Purchase conversion tracked:', sessionId);
      } catch (error) {
        console.error('[Reddit Pixel] Error tracking conversion:', error);
      }
    }
  }, [sessionId]);

  // Main effect - verify payment, add credits, then generate
  useEffect(() => {
    if (hasProcessedGeneration.current) return;
    
    const generationIntentV2 = localStorage.getItem("dashboardV2_generationIntent");
    const generationIntentV3 = localStorage.getItem("dashboardV3_generationIntent");
    
    // If no generation intent, just show normal success page
    if (!generationIntentV2 && !generationIntentV3) {
      setIsProcessing(false);
      
      const savedData = localStorage.getItem("dashboardV2_formData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.resumeStep === "upload") {
            setHasPage2FormData(true);
          }
        } catch (e) {}
      }
      
      const savedDataV3 = localStorage.getItem("dashboardV3_formData");
      if (savedDataV3) {
        setHasPage3FormData(true);
      }
      return;
    }
    
    hasProcessedGeneration.current = true;
    setIsProcessing(true);
    
    const processPaymentAndGenerate = async () => {
      const isV3 = !!generationIntentV3;
      const intentStr = isV3 ? generationIntentV3 : generationIntentV2;
      
      try {
        const intent = JSON.parse(intentStr!);
        console.log("[PaymentSuccess] Parsed generation intent:", {
          resumeStep: intent.resumeStep,
          hasUserImages: !!intent.userImages,
          userImagesCount: intent.userImages?.length || 0,
          hasUserImageUrls: !!intent.userImageUrls,
          userImageUrlsCount: intent.userImageUrls?.length || 0,
          hasFormData: !!intent.formData,
          selectedPrice: intent.selectedPrice,
        });
        
        if (!intent.resumeStep || intent.resumeStep !== "generate") {
          throw new Error(`Invalid generation intent: resumeStep is "${intent.resumeStep}", expected "generate"`);
        }
        
        if (!intent.userImages || intent.userImages.length === 0) {
          if (!intent.userImageUrls || intent.userImageUrls.length === 0) {
            throw new Error("Invalid generation intent: No user images found (neither userImages nor userImageUrls)");
          }
        }
        
        // Step 1: Verify payment and add credits using the session_id
        if (sessionId) {
          setStatusMessage("Confirming payment...");
          console.log("[PaymentSuccess] Verifying payment and adding credits...");
          
          try {
            const verifyResult = await verifyPaymentMutation.mutateAsync({ sessionId });
            console.log("[PaymentSuccess] Verify result:", verifyResult);
            
            if (verifyResult.success) {
              console.log(`[PaymentSuccess] ✅ Credits verified/added. User now has ${verifyResult.credits} credits`);
              
              if (verifyResult.added) {
                toast.success(`${verifyResult.added} credits added to your account!`, { duration: 2000 });
              }
              
              // Refresh user context to ensure latest credits are available
              await refreshUser();
              console.log("[PaymentSuccess] User context refreshed");
            } else {
              console.warn("[PaymentSuccess] Payment verification issue:", verifyResult.message);
              // Continue anyway - maybe webhook already processed it
              // Still refresh user context in case webhook already added credits
              await refreshUser();
            }
          } catch (verifyError: any) {
            console.error("[PaymentSuccess] Error verifying payment:", verifyError);
            // Continue anyway - try to generate
            // Still refresh user context in case webhook already added credits
            await refreshUser();
          }
          
          // Small delay after adding credits to ensure database sync
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Step 2: Upload images
        setStatusMessage("Uploading your image...");
        
        if (isV3) {
          // V3 Generation
          setHasPage3FormData(true);
          
          // Use the uploaded image URL directly (image was uploaded before payment)
          // This avoids 413 Content Too Large error
          if (!intent.userImageUrl) {
            throw new Error("Image URL not found. Please try generating again.");
          }
          
          const trainingImageUrls = [intent.userImageUrl];
          
          setStatusMessage("Creating your headshots...");
          
          const { tab, selectedExampleImageId, customPrompt } = intent.formData;
          
          const selectedExampleImage = tab !== "custom" 
            ? exampleImages.find((img) => img.id === selectedExampleImageId)
            : null;
          
          const promptBody = tab === "custom"
            ? (customPrompt || "").trim()
            : (selectedExampleImage?.prompt || "A professional headshot in a studio setting with soft, even lighting.");

          const selectedUrl = selectedExampleImage?.url ?? "/image_selection/Man/1_man_office_elegant.webp";

          let absoluteUrl = selectedUrl;
          if (!selectedUrl.startsWith("http")) {
            const publicDomain = window.location.origin;
            absoluteUrl = selectedUrl.startsWith("/") ? `${publicDomain}${selectedUrl}` : `${publicDomain}/${selectedUrl}`;
          }

          const basePrompt = `Create a professional headshot for this person, following the guidance below. The photograph and the person should look real, like it was taken from a premium photograph session:

${promptBody}

Output should be a vertical rectangle. Entire head should be visible`;

          const result = await generateMutation.mutateAsync({
            modelId: undefined,
            trainingImageUrls,
            exampleImages: [
              {
                id: tab === "custom" ? 1 : (selectedExampleImage?.id ?? 1),
                url: absoluteUrl,
                prompt: promptBody,
              },
            ],
            basePrompt,
            aspectRatio: "9:16",
            numImagesPerExample: 4,
            glasses: "no",
            hairColor: undefined,
            hairStyle: undefined,
            backgrounds: [],
            styles: [],
          });

          // Clear saved data
          localStorage.removeItem("dashboardV3_generationIntent");
          localStorage.removeItem("dashboardV3_formData");
          
          if (result.batchId) {
            window.location.href = `/dashboard/generate?variant=page3&batchId=${result.batchId}`;
          } else {
            throw new Error("No batchId returned from generation");
          }
        } else {
          // V2 Generation
          setHasPage2FormData(true);
          
          const gender = intent.formData.gender === "man" || intent.formData.gender === "woman" 
            ? intent.formData.gender 
            : "man";
          
          // Use saved URLs if available (new format), otherwise upload base64 (old format for backwards compatibility)
          let userImageUrls: string[];
          if (intent.userImageUrls && intent.userImageUrls.length > 0) {
            // New format: URLs already uploaded
            userImageUrls = intent.userImageUrls;
          } else if (intent.userImages && intent.userImages.length > 0) {
            // Old format: upload base64 data first (one at a time to avoid 413 error)
            setStatusMessage("Uploading your images...");
            const uploadedUrls: string[] = [];
            
            for (const image of intent.userImages) {
              const uploadResult = await uploadPage2ImagesMutation.mutateAsync({
                images: [image], // Upload one at a time
              });

              if (!uploadResult.urls || uploadResult.urls.length === 0) {
                throw new Error("Failed to upload images");
              }

              uploadedUrls.push(uploadResult.urls[0]);
            }

            userImageUrls = uploadedUrls;
          } else {
            throw new Error("No image data found. Please try generating again.");
          }

          setStatusMessage("Creating your headshots...");

          const result = await generateFromPage2Mutation.mutateAsync({
            userImageUrls: userImageUrls,
            formData: {
              ...intent.formData,
              gender,
            },
            exampleImageId: 1,
            aspectRatio: "9:16",
            numImagesPerExample: 4,
            selectedPrice: (intent.selectedPrice || "standard") as "basic" | "standard" | "premium",
          });

          // Clear saved data
          localStorage.removeItem("dashboardV2_generationIntent");
          localStorage.removeItem("dashboardV2_formData");
          
          if (result.batchId) {
            window.location.href = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
          } else {
            throw new Error("No batchId returned from generation");
          }
        }
      } catch (error: any) {
        console.error("[PaymentSuccess] Generation failed:", error);
        setIsProcessing(false);
        toast.error(t("dashboardV2.generationError") || "Failed to start generation", {
          description: error?.message || t("generateImages.pleaseTryAgain"),
        });
        
        setTimeout(() => {
          const variant = generationIntentV3 ? "page3" : "page2";
          setLocation(`/dashboard?variant=${variant}`);
        }, 3000);
      }
    };
    
    processPaymentAndGenerate();
  }, [sessionId, verifyPaymentMutation, generateFromPage2Mutation, uploadPage2ImagesMutation, uploadImagesMutation, generateMutation, setLocation, t]);

  const handleContinue = () => {
    if (isProcessing) return;
    
    if (hasPage3FormData) {
      setLocation("/dashboard?variant=page3");
    } else if (hasPage2FormData) {
      setLocation("/dashboard?variant=page2");
    } else {
      setLocation("/dashboard");
    }
  };

  // Show processing/loading state
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{statusMessage}</h2>
            <p className="text-muted-foreground">
              Please wait, this will only take a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal success UI (only shown if no generation intent)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full overflow-hidden">
        <CardContent className="p-6 md:p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {t("payment.success.title")}
            </h1>
            <p className="text-muted-foreground break-words">
              {t("payment.success.message")}
            </p>
          </div>

          {sessionId && (
            <div className="text-xs text-muted-foreground break-all bg-muted/50 p-3 rounded-md">
              <p className="font-semibold mb-1">{t("payment.success.sessionIdLabel")}</p>
              <p className="font-mono text-[10px] leading-relaxed">{sessionId}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleContinue} className="w-full">
              {(hasPage2FormData || hasPage3FormData) 
                ? t("payment.success.continueCreating") || t("payment.success.goToDashboard") 
                : t("payment.success.goToDashboard")}
            </Button>
            {!hasPage2FormData && !hasPage3FormData && (
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard/credits/buy")}
                className="w-full"
              >
                {t("payment.success.buyMore")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
