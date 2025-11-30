import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [hasPage2FormData, setHasPage2FormData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasProcessedGeneration = useRef(false);
  
  const generateFromPage2Mutation = trpc.photo.generateFromPage2.useMutation();
  
  // Debug: Log component render
  console.log("[PaymentSuccess] Component rendered");
  
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("session_id");
  }, []);

  useEffect(() => {
    // The webhook should have already processed the payment
    // But we can show a success message
    console.log("[PaymentSuccess] Payment successful, session ID:", sessionId);
    
    let redirectTimer: NodeJS.Timeout | null = null;
    
    // Check if user has saved form data from DashboardV2 flow
    const savedData = localStorage.getItem("dashboardV2_formData");
    console.log("[PaymentSuccess] Checking saved form data:", savedData ? "found" : "not found");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log("[PaymentSuccess] Parsed form data:", parsed);
        if (parsed.resumeStep === "upload") {
          setHasPage2FormData(true);
          
          // Auto-redirect to upload step after a brief delay to ensure credits are updated
          // Wait a bit for webhook to process credits, then redirect
          redirectTimer = setTimeout(() => {
            console.log("[PaymentSuccess] Auto-redirecting to upload step...");
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
    console.log("[PaymentSuccess] Checking generation intent:", generationIntent ? "found" : "not found");
    console.log("[PaymentSuccess] hasProcessedGeneration:", hasProcessedGeneration.current);
    
    if (generationIntent && !hasProcessedGeneration.current) {
      hasProcessedGeneration.current = true;
      
      try {
        const intent = JSON.parse(generationIntent);
        console.log("[PaymentSuccess] Parsed generation intent:", {
          resumeStep: intent.resumeStep,
          hasUserImages: !!intent.userImages,
          userImagesLength: intent.userImages?.length || 0,
          hasFormData: !!intent.formData,
          selectedPrice: intent.selectedPrice,
        });
        
        // Only auto-generate if we have userImages (user uploaded files before payment)
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0 && intent.formData) {
          console.log("[PaymentSuccess] ✅ Found generation intent with uploaded files, auto-resuming generation...");
          setIsGenerating(true);
          
          // Auto-start generation after a brief delay to ensure credits are updated
          setTimeout(async () => {
            try {
              // Ensure gender is valid (required by the API)
              const gender = intent.formData.gender === "man" || intent.formData.gender === "woman" 
                ? intent.formData.gender 
                : "man";
              
              const result = await generateFromPage2Mutation.mutateAsync({
                userImages: intent.userImages,
                formData: {
                  ...intent.formData,
                  gender, // Ensure gender is "man" | "woman" (required)
                },
                exampleImageId: 1, // Ignored - server now selects randomly based on filters
                aspectRatio: "9:16",
                numImagesPerExample: 4, // This will be overridden by selectedPrice on the server
                selectedPrice: (intent.selectedPrice || "standard") as "basic" | "standard" | "premium",
              });

              console.log("[PaymentSuccess] Generation started successfully, batchId:", result.batchId);
              
              // Clear ALL saved data after successful generation
              localStorage.removeItem("dashboardV2_generationIntent");
              localStorage.removeItem("dashboardV2_formData");
              console.log("[PaymentSuccess] Cleared all saved generation data");
              
              // Redirect to generate page with batchId
              if (result.batchId) {
                toast.success(t("dashboardV2.generationStarted") || "Generation started!", {
                  duration: 2000,
                });
                
                const redirectUrl = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
                setLocation(redirectUrl);
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
        } else {
          console.log("[PaymentSuccess] ⚠️ Generation intent found but conditions not met:", {
            resumeStep: intent.resumeStep,
            hasUserImages: !!intent.userImages,
            userImagesLength: intent.userImages?.length || 0,
            hasFormData: !!intent.formData,
            willNotAutoGenerate: true,
          });
        }
      } catch (e) {
        console.error("[PaymentSuccess] Failed to parse generation intent:", e);
      }
    } else {
      console.log("[PaymentSuccess] ⚠️ No generation intent found or already processed - showing success message only");
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
    
    // Check if there's generation intent - if so, don't redirect, let auto-generation handle it
    const generationIntent = localStorage.getItem("dashboardV2_generationIntent");
    if (generationIntent) {
      try {
        const intent = JSON.parse(generationIntent);
        if (intent.resumeStep === "generate" && intent.userImages && intent.userImages.length > 0) {
          console.log("[PaymentSuccess] Generation intent exists, waiting for auto-generation...");
          return; // Don't redirect, let the auto-generation happen
        }
      } catch (e) {
        console.error("[PaymentSuccess] Error checking generation intent:", e);
      }
    }
    
    if (hasPage2FormData) {
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
                let shouldShowButton = true;
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
                
                return shouldShowButton ? (
                  <Button
                    onClick={handleContinue}
                    className="w-full"
                  >
                    {hasPage2FormData ? t("payment.success.continueCreating") || t("payment.success.goToDashboard") : t("payment.success.goToDashboard")}
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    {t("payment.success.waitingForGeneration") || "Please wait, generation will start automatically..."}
                  </div>
                );
              })()}
              {!hasPage2FormData && !isGenerating && (
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

