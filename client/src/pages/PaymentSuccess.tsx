import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { exampleImages } from "@/data/exampleImages";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [hasPage2FormData, setHasPage2FormData] = useState(false);
  const [hasPage3FormData, setHasPage3FormData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasProcessedGeneration = useRef(false);
  
  const generateFromPage2Mutation = trpc.photo.generateFromPage2.useMutation();
  const uploadPage2ImagesMutation = trpc.photo.uploadPage2Images.useMutation();
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();
  const generateMutation = trpc.photo.generate.useMutation();
  
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("session_id");
  }, []);

  // Track Reddit conversion on payment success
  useEffect(() => {
    if (sessionId && typeof window !== "undefined" && (window as any).rdt) {
      try {
        // Track purchase conversion with unique session ID as conversion ID
        (window as any).rdt('track', 'Purchase', {
          conversionId: sessionId
        });
        console.log('[Reddit Pixel] Purchase conversion tracked:', sessionId);
      } catch (error) {
        console.error('[Reddit Pixel] Error tracking conversion:', error);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    // The webhook should have already processed the payment
    // But we can show a success message
    
    let redirectTimer: NodeJS.Timeout | null = null;
    
    // Check if user has saved form data from DashboardV2 flow
    const savedData = localStorage.getItem("dashboardV2_formData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.resumeStep === "upload") {
          setHasPage2FormData(true);
          
          // Auto-redirect to upload step after a brief delay to ensure credits are updated
          // Wait a bit for webhook to process credits, then redirect
          redirectTimer = setTimeout(() => {
            setLocation("/dashboard?step=upload&variant=page2");
          }, 2000); // Wait 2s to ensure credits are updated
        }
      } catch (e) {
        console.error("[PaymentSuccess] Failed to parse saved form data:", e);
      }
    }

    // Check for generation intent (from upload step when credits were insufficient)
    // Only auto-generate if we have saved user images (files were uploaded)
    const generationIntent = localStorage.getItem("dashboardV2_generationIntent");
    
    if (generationIntent && !hasProcessedGeneration.current) {
      hasProcessedGeneration.current = true;
      
      try {
        const intent = JSON.parse(generationIntent);
        
        // Only auto-generate if we have userImages (user uploaded files before payment)
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0 && intent.formData) {
          setIsGenerating(true);
          
          // Auto-start generation after a brief delay to ensure credits are updated
          setTimeout(async () => {
            try {
              // Ensure gender is valid (required by the API)
              const gender = intent.formData.gender === "man" || intent.formData.gender === "woman" 
                ? intent.formData.gender 
                : "man";
              
              // Step 1: Upload images first to get URLs (avoids 413 Content Too Large error)
              const uploadResult = await uploadPage2ImagesMutation.mutateAsync({
                images: intent.userImages,
              });

              if (!uploadResult.urls || uploadResult.urls.length === 0) {
                throw new Error("Failed to upload images");
              }

              // Step 2: Generate with URLs instead of base64 data
              const result = await generateFromPage2Mutation.mutateAsync({
                userImageUrls: uploadResult.urls, // Use URLs instead of base64 data
                formData: {
                  ...intent.formData,
                  gender, // Ensure gender is "man" | "woman" (required)
                },
                exampleImageId: 1, // Ignored - server now selects randomly based on filters
                aspectRatio: "9:16",
                numImagesPerExample: 4, // This will be overridden by selectedPrice on the server
                selectedPrice: (intent.selectedPrice || "standard") as "basic" | "standard" | "premium",
              });

              
              // Clear ALL saved data after successful generation
              localStorage.removeItem("dashboardV2_generationIntent");
              localStorage.removeItem("dashboardV2_formData");
              
                // Redirect to generate page with batchId to show animation
              if (result.batchId) {
                toast.success(t("dashboardV2.generationStarted") || "Generation started!", {
                    duration: 1000,
                });
                
                  // Use window.location for immediate redirect to ensure modal shows properly
                const redirectUrl = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
                  window.location.href = redirectUrl;
              } else {
                throw new Error("No batchId returned from generation");
              }
            } catch (error: any) {
              console.error("[PaymentSuccess] Failed to auto-resume generation:", error);
              setIsGenerating(false);
              toast.error(t("dashboardV2.generationError") || "Failed to start generation", {
                description: error?.message || t("generateImages.pleaseTryAgain"),
              });
              
              // Redirect to dashboard so user can try manually
              setTimeout(() => {
                setLocation("/dashboard?variant=page2");
              }, 3000);
            }
          }, 1500); // Wait 1.5s to ensure webhook has processed credits
        }
      } catch (e) {
        console.error("[PaymentSuccess] Failed to parse generation intent:", e);
      }
    }
    
    // ========== PAGE 3 (V3) GENERATION INTENT - EXACT SAME AS V2 ==========
    const generationIntentV3 = localStorage.getItem("dashboardV3_generationIntent");
    
    if (generationIntentV3 && !hasProcessedGeneration.current) {
      hasProcessedGeneration.current = true;
      
      try {
        const intent = JSON.parse(generationIntentV3);
        
        // Only auto-generate if we have userImages (user uploaded files before payment)
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0 && intent.formData) {
          setIsGenerating(true);
          setHasPage3FormData(true);
          
          // Auto-start generation after a brief delay to ensure credits are updated
          setTimeout(async () => {
            try {
              // Step 1: Upload images first to get URLs
              const uploadResult = await uploadImagesMutation.mutateAsync({
                images: intent.userImages,
              });

              if (!uploadResult.urls || uploadResult.urls.length === 0) {
                throw new Error("Failed to upload images");
              }

              const trainingImageUrls = [uploadResult.urls[0]];
              
              // Step 2: Build prompt from saved form data
              const { tab, selectedExampleImageId, customPrompt } = intent.formData;
              
              // Find the selected example image
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

              // Step 3: Generate images
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

              // Clear ALL saved data after successful generation
              localStorage.removeItem("dashboardV3_generationIntent");
              localStorage.removeItem("dashboardV3_formData");
              
              // Redirect to generate page with batchId to show animation
              if (result.batchId) {
                toast.success(t("dashboardV2.generationStarted") || "Generation started!", {
                  duration: 1000,
                });
                
                // Use window.location for immediate redirect to ensure modal shows properly
                const redirectUrl = `/dashboard/generate?variant=page3&batchId=${result.batchId}`;
                window.location.href = redirectUrl;
              } else {
                throw new Error("No batchId returned from generation");
              }
            } catch (error: any) {
              console.error("[PaymentSuccess] Failed to auto-resume V3 generation:", error);
              setIsGenerating(false);
              toast.error(t("dashboardV2.generationError") || "Failed to start generation", {
                description: error?.message || t("generateImages.pleaseTryAgain"),
              });
              
              // Redirect to dashboard so user can try manually
              setTimeout(() => {
                setLocation("/dashboard?variant=page3");
              }, 3000);
            }
          }, 1500); // Wait 1.5s to ensure webhook has processed credits
        }
      } catch (e) {
        console.error("[PaymentSuccess] Failed to parse V3 generation intent:", e);
      }
    }
    
    // Check for page3 form data (without generation intent - just redirect)
    const savedDataV3 = localStorage.getItem("dashboardV3_formData");
    if (savedDataV3 && !generationIntentV3) {
      setHasPage3FormData(true);
    }
    
    // Cleanup function - clear redirect timer if component unmounts
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [sessionId, generateFromPage2Mutation, setLocation, t]);

  const handleContinue = () => {
    // Don't redirect if we're currently generating
    if (isGenerating) {
      return;
    }
    
    // Check if there's generation intent for page2 - if so, don't redirect, let auto-generation handle it
    const generationIntent = localStorage.getItem("dashboardV2_generationIntent");
    if (generationIntent) {
      try {
        const intent = JSON.parse(generationIntent);
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0) {
          return; // Don't redirect, let the auto-generation happen
        }
      } catch (e) {
        console.error("[PaymentSuccess] Error checking generation intent:", e);
      }
    }
    
    // Check if there's generation intent for page3 - if so, don't redirect, let auto-generation handle it
    const generationIntentV3 = localStorage.getItem("dashboardV3_generationIntent");
    if (generationIntentV3) {
      try {
        const intent = JSON.parse(generationIntentV3);
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0) {
          return; // Don't redirect, let the auto-generation happen
        }
      } catch (e) {
        console.error("[PaymentSuccess] Error checking V3 generation intent:", e);
      }
    }
    
    if (hasPage3FormData) {
      // User came from DashboardV3 flow, redirect back to continue
      setLocation("/dashboard?variant=page3");
    } else if (hasPage2FormData) {
      // User came from DashboardV2 flow, redirect back to continue
      setLocation("/dashboard?variant=page2");
    } else {
      setLocation("/dashboard");
    }
  };

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

          {isGenerating ? (
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("payment.success.startingGeneration") || "Starting image generation..."}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("payment.success.generationStartingMessage") || "Please wait while we prepare your images..."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-4">
              {/* Only show continue button if there's no generation intent */}
              {(() => {
                const generationIntent = localStorage.getItem("dashboardV2_generationIntent");
                const generationIntentV3 = localStorage.getItem("dashboardV3_generationIntent");
                let shouldShowButton = true;
                
                // Check page2 generation intent
                if (generationIntent) {
                  try {
                    const intent = JSON.parse(generationIntent);
                    // Hide button if we have generation intent with files - auto-generation will handle it
                    if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0) {
                      shouldShowButton = false;
                    }
                  } catch (e) {
                    // Show button on error
                  }
                }
                
                // Check page3 generation intent
                if (generationIntentV3) {
                  try {
                    const intent = JSON.parse(generationIntentV3);
                    // Hide button if we have generation intent with files - auto-generation will handle it
                    if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0) {
                      shouldShowButton = false;
                    }
                  } catch (e) {
                    // Show button on error
                  }
                }
                
                return shouldShowButton ? (
                  <Button
                    onClick={handleContinue}
                    className="w-full"
                  >
                    {(hasPage2FormData || hasPage3FormData) ? t("payment.success.continueCreating") || t("payment.success.goToDashboard") : t("payment.success.goToDashboard")}
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    {t("payment.success.waitingForGeneration") || "Please wait, generation will start automatically..."}
                  </div>
                );
              })()}
              {!hasPage2FormData && !hasPage3FormData && !isGenerating && (
                <Button
                  variant="outline"
                  onClick={() => setLocation("/dashboard/credits/buy")}
                  className="w-full"
                >
                  {t("payment.success.buyMore")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
