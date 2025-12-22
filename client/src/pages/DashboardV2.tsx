import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { exampleImages, filterExampleImages } from "@/data/exampleImages";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { detectCurrency, getPage2Price, PAGE2_PRICES, PAGE2_OLD_PRICES, type Currency } from "@/utils/currency";
import { safeLocalStorage } from "@/utils/localStorage";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Upload,
  Check,
  User,
  Calendar,
  Palette,
  Scissors,
  Shirt,
  Image as ImageIcon,
  Camera,
  X,
  Star,
  Zap,
  Loader2,
  Plus,
  PlusCircle,
  CreditCard,
  Settings,
  HelpCircle,
  ShieldCheck
} from "lucide-react";

type Step = "welcome" | "gender" | "age" | "hairColor" | "hairLength" | "hairStyle" | "ethnicity" | "bodyType" | "attire" | "background" | "pricing" | "upload";

type UploadedFile = {
  id: string;
  file: File;
  preview: string;
};

export default function DashboardV2() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    hairColor: "",
    hairLength: "",
    hairStyle: "",
    ethnicity: "",
    bodyType: "",
    attire: [] as string[],
    backgrounds: [] as string[],
    selectedPrice: "" as "" | "basic" | "standard" | "premium",
  });

  const steps: { key: Step; number: number; title: string }[] = useMemo(() => [
    { key: "welcome", number: 0, title: t("dashboardV2.welcome") },
    { key: "gender", number: 1, title: t("dashboardV2.gender") },
    { key: "age", number: 2, title: t("dashboardV2.age") },
    { key: "hairColor", number: 3, title: t("dashboardV2.hairColor") },
    { key: "hairLength", number: 4, title: t("dashboardV2.hairLength") },
    { key: "hairStyle", number: 5, title: t("dashboardV2.hairStyle") },
    { key: "ethnicity", number: 6, title: t("dashboardV2.ethnicity") },
    { key: "bodyType", number: 7, title: t("dashboardV2.bodyType") },
    { key: "attire", number: 8, title: t("dashboardV2.attire") },
    { key: "background", number: 9, title: t("dashboardV2.background") },
    { key: "upload", number: 10, title: t("dashboardV2.upload") },
    { key: "pricing", number: 11, title: t("dashboardV2.pricing") },
  ], [t]);

  const currentStepIndex = useMemo(() => {
    const index = steps.findIndex(s => s.key === currentStep);
    return index >= 0 ? index : 0; // Fallback to 0 if step not found
  }, [steps, currentStep]);
  
  const progress = useMemo(() => {
    return ((currentStepIndex + 1) / steps.length) * 100;
  }, [currentStepIndex, steps.length]);

  // Control layout visibility based on current step
  // Show full layout (sidebar + header) only on welcome step
  useEffect(() => {
    const showFullLayout = currentStep === "welcome";
    window.dispatchEvent(new CustomEvent('aiselfi-dashboard-layout-mode', { 
      detail: { showFullLayout } 
    }));
    
    // Cleanup: restore full layout when component unmounts
    return () => {
      window.dispatchEvent(new CustomEvent('aiselfi-dashboard-layout-mode', { 
        detail: { showFullLayout: true } 
      }));
    };
  }, [currentStep]);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex].key;
      setCurrentStep(nextStep);
    } else {
      // Navigate to upload/generate page with variant=page2 to maintain the flow
      setLocation("/dashboard/generate?variant=page2");
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  // Initialize mutations at component level (hooks must be at top level)
  const generateFromPage2Mutation = trpc.photo.generateFromPage2.useMutation();
  const uploadPage2ImagesMutation = trpc.photo.uploadPage2Images.useMutation();
  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  const { data: packs, isLoading: isLoadingPacks } = trpc.payment.listPacks.useQuery();

  // Check for step parameter in URL (e.g., after payment redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get("step");
    const paymentParam = urlParams.get("payment"); // cancelled | error
    const validSteps = ["welcome", "gender", "age", "hairColor", "hairLength", "hairStyle", "ethnicity", "bodyType", "attire", "background", "pricing", "upload"];

    let shouldCleanUrl = false;

    // If Stripe/checkout flow reports a status, always bring user back to plans
    if (paymentParam === "cancelled") {
      setCurrentStep("pricing");
      toast.error(t("payment.cancel.title") || "Payment Cancelled", {
        description: t("payment.cancel.message") || "You cancelled the payment process. No charges were made.",
        duration: 5000,
      });
      urlParams.delete("payment");
      shouldCleanUrl = true;
    } else if (paymentParam === "error") {
      setCurrentStep("pricing");
      toast.error(t("buyCredits.checkoutStartFailed") || "Payment error", {
        description: t("buyCredits.checkoutFailed") || "Please try again.",
        duration: 5000,
      });
      urlParams.delete("payment");
      shouldCleanUrl = true;
    }

    // Step param (e.g. deep link back to a step)
    if (!paymentParam && stepParam && validSteps.includes(stepParam)) {
      setCurrentStep(stepParam as Step);
      urlParams.delete("step");
      shouldCleanUrl = true;
    } else if (stepParam) {
      // Even if payment param existed, remove step from URL to keep it clean
      urlParams.delete("step");
      shouldCleanUrl = true;
    }

    if (shouldCleanUrl) {
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Check for saved form data (e.g., after returning from purchase or reload)
  useEffect(() => {
    const savedData = safeLocalStorage.getItem("dashboardV2_formData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Restore form data - ensure arrays are actually arrays
        setFormData({
          gender: parsed.gender || "",
          age: parsed.age || "",
          hairColor: parsed.hairColor || "",
          hairLength: parsed.hairLength || "",
          hairStyle: parsed.hairStyle || "",
          ethnicity: parsed.ethnicity || "",
          bodyType: parsed.bodyType || "",
          attire: Array.isArray(parsed.attire) ? parsed.attire : [],
          backgrounds: Array.isArray(parsed.backgrounds) ? parsed.backgrounds : [],
          selectedPrice: parsed.selectedPrice || "",
        });
        
        // Priority 1: If resumeStep is set (from purchase flow) and user has credits
        if (parsed.resumeStep === "upload" && (user?.credits ?? 0) > 0) {
          setCurrentStep("upload");
          // Check if we have saved files to auto-generate after payment
          // This will be handled by the useEffect that watches currentStep and generationIntent
        } 
        // Priority 2: Restore the last saved step
        else if (parsed.currentStep) {
          // Verify it's a valid step
          const validSteps = steps.map(s => s.key);
          if (validSteps.includes(parsed.currentStep)) {
            setCurrentStep(parsed.currentStep as Step);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved form data:", e);
        safeLocalStorage.removeItem("dashboardV2_formData");
      }
    }
  }, [user?.credits]); // Run when credits are loaded

  // Save progress automatically whenever step or form data changes
  useEffect(() => {
    // Create object with current state
    const dataToSave = {
      ...formData,
      currentStep,
      timestamp: Date.now()
    };
    
    safeLocalStorage.setItem("dashboardV2_formData", JSON.stringify(dataToSave));
  }, [formData, currentStep]);

  // Auto-start generation when returning to upload step after payment with saved files
  const hasAutoGeneratedRef = useRef(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  useEffect(() => {
    // Only run if:
    // 1. We're on upload step
    // 2. User has credits
    // 3. We have saved generation intent with files
    // 4. We haven't already auto-generated
    if (
      currentStep === "upload" &&
      (user?.credits ?? 0) > 0 &&
      !hasAutoGeneratedRef.current &&
      !isAutoGenerating
    ) {
      const generationIntent = safeLocalStorage.getItem("dashboardV2_generationIntent");
      if (generationIntent) {
        try {
          const intent = JSON.parse(generationIntent);
          if (
            intent.resumeStep === "generate" &&
            (intent.userImageUrls || intent.userImages) &&
            intent.formData
          ) {
            hasAutoGeneratedRef.current = true;
            setIsAutoGenerating(true);
            
            // Auto-start generation
            (async () => {
              try {
                // Ensure gender is valid (required by the API)
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
                  throw new Error("No image data found in generation intent");
                }

                // Step 2: Generate with URLs
                const result = await generateFromPage2Mutation.mutateAsync({
                  userImageUrls: userImageUrls, // Use URLs
                  formData: {
                    ...intent.formData,
                    gender, // Ensure gender is "man" | "woman" (required)
                  },
                  exampleImageId: 1, // Ignored - server now selects randomly based on filters
                  aspectRatio: "9:16",
                  numImagesPerExample: 4, // This will be overridden by selectedPrice on the server
                  selectedPrice: (intent.selectedPrice || "standard") as "basic" | "standard" | "premium",
                });

                // Clear saved data after successful generation
                safeLocalStorage.removeItem("dashboardV2_generationIntent");
                safeLocalStorage.removeItem("dashboardV2_formData");
                
                // Show success toast briefly
                toast.success(t("dashboardV2.generationStarted"), {
                  duration: 1000,
                });
                
                // Redirect to generate page with batchId to show animation
                if (result.batchId) {
                  const redirectUrl = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
                  // Use window.location for immediate redirect to ensure modal shows
                  window.location.href = redirectUrl;
                } else {
                  throw new Error("No batchId returned from generation");
                }
              } catch (error: any) {
                console.error("[DashboardV2] Failed to auto-resume generation:", error);
                hasAutoGeneratedRef.current = false; // Allow retry
                setIsAutoGenerating(false);
                toast.error(t("dashboardV2.generationError") || "Failed to start generation", {
                  description: error?.message || t("generateImages.pleaseTryAgain"),
                });
              }
            })();
          }
        } catch (e) {
          console.error("[DashboardV2] Failed to parse generation intent:", e);
        }
      }
    }
    
    // Reset flag when leaving upload step
    if (currentStep !== "upload") {
      hasAutoGeneratedRef.current = false;
      setIsAutoGenerating(false);
    }
  }, [currentStep, user?.credits, generateFromPage2Mutation, uploadPage2ImagesMutation, setLocation, t, isAutoGenerating]);

  const updateFormData = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: "attire" | "backgrounds", value: string) => {
    setFormData(prev => {
      const arr = prev[key] as string[];
      // For variant 2, only allow single selection
      return {
        ...prev,
        [key]: arr.includes(value) 
          ? [] // Deselect if clicking the same item
          : [value] // Replace with only the selected item
      };
    });
  };

  // Determine if Continue button should be enabled based on current step
  const isContinueEnabled = () => {
    switch (currentStep) {
      case "welcome":
        return true; // Always enabled on welcome
      case "gender":
      case "age":
      case "hairColor":
      case "hairLength":
      case "hairStyle":
      case "ethnicity":
      case "bodyType":
        return !!formData[currentStep];
      case "attire":
        return formData.attire.length > 0;
      case "background":
        return formData.backgrounds.length > 0;
      case "pricing":
        return !!formData.selectedPrice;
      case "upload":
        return uploadedFiles.length > 0;
      default:
        return false;
    }
  };

  // Handle continue for upload step
  const handleUploadContinue = async () => {
    if (uploadedFiles.length === 0) {
      toast.error(t("dashboardV2.noFilesSelected"), {
        description: t("dashboardV2.pleaseSelectFiles"),
      });
      return;
    }

    if (uploadedFiles.length < 1) {
      toast.error(t("dashboardV2.minFilesError"), {
        description: t("dashboardV2.pleaseSelectFiles"),
      });
      return;
    }

    if (!user?.id) {
      toast.error(t("dashboardV2.userNotAuthenticated"), {
        description: t("dashboardV2.pleaseLogin"),
      });
      return;
    }

    // Check if user has enough credits before generating
    // If no credits, immediately redirect to pricing step (images will be uploaded after payment)
    if ((user?.credits ?? 0) <= 0) {
      // Save file data as base64 for later upload (after payment)
      // This is faster than uploading to server first
      try {
        const userImages: Array<{ data: string; fileName: string; contentType: string }> = [];
        
        // Convert files to base64 quickly (just reading, not uploading)
        for (const file of uploadedFiles) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file.file);
          });

          userImages.push({
            data: base64,
            fileName: file.file.name,
            contentType: file.file.type,
          });
        }
        
        // Save generation intent with base64 image data (will be uploaded after payment)
        const generationIntent = {
          resumeStep: "generate",
          userImages: userImages, // Save base64 data - will be uploaded when returning after payment
          formData: formData,
          selectedPrice: formData.selectedPrice || "standard",
        };
        safeLocalStorage.setItem("dashboardV2_generationIntent", JSON.stringify(generationIntent));
        
        // Also save form data with resume step
        const dataToSave = {
          ...formData,
          resumeStep: "upload", // After payment, go back to upload (which will auto-generate)
          currentStep: "pricing",
        };
        safeLocalStorage.setItem("dashboardV2_formData", JSON.stringify(dataToSave));
      } catch (error) {
        console.error("[DashboardV2] Failed to save file data:", error);
        // Still redirect to pricing even if saving fails
      }
      
      // Immediately navigate to pricing step (no delay from server uploads)
      setCurrentStep("pricing");
      return;
    }

    // Generate images directly using new page2 API
    try {
      const loadingToast = toast.loading(t("dashboardV2.generatingImages"));
      
      // Step 1: Upload images one at a time to get URLs (avoids 413 Content Too Large error)
      // Upload sequentially instead of all at once to prevent payload size issues
      const uploadedUrls: string[] = [];
      
      for (const file of uploadedFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file.file);
        });

        // Upload one image at a time
        const uploadResult = await uploadPage2ImagesMutation.mutateAsync({
          images: [{
            data: base64,
            fileName: file.file.name,
            contentType: file.file.type,
          }],
        });

        if (!uploadResult.urls || uploadResult.urls.length === 0) {
          throw new Error(t("dashboardV2.imageUploadFailed"));
        }

        uploadedUrls.push(uploadResult.urls[0]);
      }

      if (uploadedUrls.length === 0) {
        throw new Error(t("dashboardV2.imageUploadFailed"));
      }

      // Step 2: Call generation API with URLs instead of base64 data
      const selectedPrice = formData.selectedPrice || "standard"; // Default to standard if not selected
      
      // Ensure gender is valid (required by the API)
      const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
      
      const result = await generateFromPage2Mutation.mutateAsync({
        userImageUrls: uploadedUrls, // Use URLs instead of base64 data
        formData: {
          ...formData,
          gender, // Ensure gender is "man" | "woman" (required)
        },
        exampleImageId: 1, // Ignored - server now selects randomly based on filters
        aspectRatio: "9:16",
        numImagesPerExample: 4, // This will be overridden by selectedPrice on the server
        selectedPrice: selectedPrice as "basic" | "standard" | "premium",
      });

      toast.dismiss(loadingToast);
      
      
      if (result.batchId) {
        // Clear saved form data and step to reset flow for next creation
        safeLocalStorage.removeItem("dashboardV2_formData");
        safeLocalStorage.removeItem("dashboardV2_generationIntent");
        console.log("[DashboardV2] ✅ Cleared saved form data after successful generation start");
        
        // Show success toast briefly
        toast.success(t("dashboardV2.generationStarted"), {
          duration: 1500,
        });
        
        // Navigate immediately - use window.location as fallback if setLocation doesn't work
        const redirectUrl = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
        
        try {
          setLocation(redirectUrl);
          // Fallback: if setLocation doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname + window.location.search !== redirectUrl) {
              console.warn("[DashboardV2] setLocation didn't work, using window.location");
              window.location.href = redirectUrl;
            }
          }, 100);
        } catch (error) {
          console.error("[DashboardV2] Error with setLocation, using window.location:", error);
          window.location.href = redirectUrl;
        }
      } else {
        console.error("[DashboardV2] No batchId in result:", result);
        throw new Error(t("generateImages.failedToStartGeneration"));
      }
    } catch (error: any) {
      toast.error(t("dashboardV2.generationError"), {
        description: error?.message || t("generateImages.pleaseTryAgain"),
      });
    }
  };

  // Handle purchase for pricing step
  const handlePricingPurchase = async () => {
    if (!formData.selectedPrice || isLoadingPacks || createCheckoutMutation.isPending) return;
    
    const plan = formData.selectedPrice as "basic" | "standard" | "premium";
    
    // Check if we have a generation intent (user came from upload step with no credits)
    // If so, ensure it's preserved before redirecting to checkout
    const existingIntent = safeLocalStorage.getItem("dashboardV2_generationIntent");
    if (existingIntent) {
      try {
        const intent = JSON.parse(existingIntent);
        // Update the selectedPrice in the intent to match what user selected
        const updatedIntent = {
          ...intent,
          selectedPrice: plan,
          formData: {
            ...intent.formData,
            selectedPrice: plan,
          },
        };
        safeLocalStorage.setItem("dashboardV2_generationIntent", JSON.stringify(updatedIntent));
        console.log("[DashboardV2] Updated generation intent with selected price:", plan);
      } catch (e) {
        console.error("[DashboardV2] Failed to update generation intent:", e);
      }
    }
    const currency = detectCurrency();
    
    // Get prices for the selected plan
    const basicPrice = getPage2Price("basic", currency);
    const standardPrice = getPage2Price("standard", currency);
    const premiumPrice = getPage2Price("premium", currency);
    const displayedPrice = plan === "basic" ? basicPrice : plan === "standard" ? standardPrice : premiumPrice;
    const expectedPriceCents = displayedPrice.amount;
    const oldPriceCents = displayedPrice.oldAmount || null;
    
    // Find matching pack
    let packId: number | null = null;
    if (packs && packs.length > 0) {
      // Try exact match
      let matchedPack = packs.find(p => {
        const packPrice = parseFloat(p.price.toString());
        const packPriceCents = Math.round(packPrice * 100);
        return Math.abs(packPriceCents - expectedPriceCents) <= 1;
      });
      
      // Try old price if no match
      if (!matchedPack && oldPriceCents) {
        matchedPack = packs.find(p => {
          const packPrice = parseFloat(p.price.toString());
          const packPriceCents = Math.round(packPrice * 100);
          return Math.abs(packPriceCents - oldPriceCents) <= 1;
        });
      }
      
      // Fallback to order-based
      if (!matchedPack) {
        const sortedByPrice = [...packs].sort((a, b) => {
          return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
        });
        if (plan === "basic" && sortedByPrice.length >= 1) {
          matchedPack = sortedByPrice[0];
        } else if (plan === "standard" && sortedByPrice.length >= 2) {
          matchedPack = sortedByPrice[1];
        } else if (plan === "premium" && sortedByPrice.length >= 3) {
          matchedPack = sortedByPrice[2];
        }
      }
      
      packId = matchedPack?.id || null;
    }
    
    if (!packId) {
      toast.error(t("buyCredits.packNotFound") || "Pack not found", {
        description: t("generateImages.pleaseTryAgain") || "Please try again",
      });
      return;
    }
    
    try {
      // Save form data to localStorage
      const dataToSave = {
        ...formData,
        selectedPrice: plan,
        resumeStep: "upload",
        currentStep: "pricing",
      };
      safeLocalStorage.setItem("dashboardV2_formData", JSON.stringify(dataToSave));
      
      // Create checkout session
      const result = await createCheckoutMutation.mutateAsync({ 
        packId,
        currency: currency,
        variant: "page2",
      });
      
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error(t("buyCredits.checkoutFailed") || "Failed to create checkout session");
      }
    } catch (error: any) {
      toast.error(error?.message || t("buyCredits.checkoutStartFailed") || "Failed to start checkout");
    }
  };

  // Get the handler for Continue button based on current step
  const getContinueHandler = () => {
    if (currentStep === "upload") {
      return handleUploadContinue;
    }
    if (currentStep === "pricing") {
      return handlePricingPurchase;
    }
    return handleNext;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Loading overlay when auto-generating after payment */}
      {isAutoGenerating && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="text-lg font-semibold">{t("dashboardV2.generatingImages") || "Starting image generation..."}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("payment.success.generationStartingMessage") || "Please wait while we prepare your images..."}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header with Progress - only show when NOT on welcome step */}
      {currentStep !== "welcome" && (
      <div className="border-b border-border bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base sm:text-lg whitespace-nowrap">{t("dashboardV2.appName")}</span>
            </div>
            <div className="flex-1 min-w-0 mx-2 sm:mx-4">
              <Progress value={progress} className="h-2" />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground shrink-0 whitespace-nowrap">
              {currentStepIndex + 1} / {steps.length}
            </div>
          </div>
        </div>
      </div>
      )}

      <div className={`max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 ${currentStep === "welcome" && isMobile ? "pb-20" : "pb-24"}`}>
        {/* Back Button */}
        {currentStepIndex > 0 && (
          <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("dashboardV2.back")}
          </Button>
            {/* Mobile: Show circular indicator on the opposite side */}
            {isMobile && (
              <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{currentStepIndex + 1}</span>
              </div>
            )}
          </div>
        )}

        {/* Step Indicator - Hide on mobile for steps 2+ */}
        <div className={`flex justify-center mb-6 ${isMobile && currentStepIndex > 0 ? 'hidden' : ''}`} style={{ transform: 'translateY(-16px)' }}>
          <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <span className="text-base font-bold text-primary">{currentStepIndex + 1}</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            {currentStep === "welcome" && (
              <WelcomeStep onNext={handleNext} />
            )}

            {currentStep === "gender" && (
              <GenderStep
                value={formData.gender}
                onChange={(value) => updateFormData("gender", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "age" && (
              <AgeStep
                value={formData.age}
                onChange={(value) => updateFormData("age", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairColor" && (
              <HairColorStep
                value={formData.hairColor}
                onChange={(value) => updateFormData("hairColor", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairLength" && (
              <HairLengthStep
                value={formData.hairLength}
                onChange={(value) => updateFormData("hairLength", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairStyle" && (
              <HairStyleStep
                value={formData.hairStyle}
                onChange={(value) => updateFormData("hairStyle", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "ethnicity" && (
              <EthnicityStep
                value={formData.ethnicity}
                onChange={(value) => updateFormData("ethnicity", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "bodyType" && (
              <BodyTypeStep
                value={formData.bodyType}
                onChange={(value) => updateFormData("bodyType", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "attire" && (
              <AttireStep
                value={formData.attire}
                onChange={(value) => toggleArrayValue("attire", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "background" && (
              <BackgroundStep
                value={formData.backgrounds}
                onChange={(value) => toggleArrayValue("backgrounds", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "pricing" && (
              <PricingStep
                value={formData.selectedPrice}
                onChange={(value) => updateFormData("selectedPrice", value)}
                onNext={handleNext}
                formData={formData}
                createCheckoutMutation={createCheckoutMutation}
                packs={packs}
                isLoadingPacks={isLoadingPacks}
              />
            )}

            {currentStep === "upload" && (
              <UploadStep 
                onNext={handleNext}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                fileInputRef={fileInputRef}
                user={user}
                formData={formData}
                generateFromPage2Mutation={generateFromPage2Mutation}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation Bar - Only on welcome step and mobile */}
      {currentStep === "welcome" && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation("/dashboard/start?variant=page2")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Start Here"
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation("/dashboard/gallery?variant=page2")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Gallery"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gallery</span>
              </button>

              {/* Create - Centered, Prominent Button */}
              <button
                onClick={() => setLocation("/dashboard/generate?variant=page2")}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                aria-label="Create"
              >
                <Plus className="h-7 w-7" />
              </button>

              {/* Buy Credits */}
              <button
                onClick={() => setLocation("/dashboard/credits/buy?variant=page2")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Buy Credits"
              >
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation("/dashboard/settings/general?variant=page2")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation with Continue Button - Only from step 2 onwards */}
      {currentStepIndex > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 p-4 sm:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <Button
              size="lg"
              onClick={getContinueHandler()}
              disabled={
                !isContinueEnabled() || 
                (currentStep === "pricing" && (isLoadingPacks || createCheckoutMutation.isPending))
              }
              className="bg-primary hover:bg-primary/90 rounded-full disabled:opacity-50"
              style={{ width: '200px', margin: '0 auto', display: 'block' }}
            >
              {currentStep === "pricing" && (isLoadingPacks || createCheckoutMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("buyCredits.loading") || "Loading..."}
                </div>
              ) : currentStep === "upload" ? (
                t("dashboardV2.create") || "Create"
              ) : (
                t("dashboardV2.continue")
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Get a mix of example images for display (3 images - top row only)
  // Include a woman in the middle to show the service works for everyone
  // Man (left), Woman (middle), Man (right)
  const womanImage = exampleImages.find(img => img.id === 47) || exampleImages.find(img => img.gender === "woman") || exampleImages[1];
  const displayImages = [
    exampleImages[0], // First man (id: 1) - left
    womanImage, // Woman (id: 47) - middle
    exampleImages[2], // Third man (id: 3) - right
  ];

  return (
    <div className="text-center space-y-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold break-words">
        {t("dashboardV2.welcomeTitle")}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {t("dashboardV2.welcomeDescription")}
      </p>
      
      {/* Example Images Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 max-w-2xl mx-auto">
        {displayImages.map((img) => (
          <div key={img.id} className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <img
              src={img.url}
              alt={t("dashboardV2.exampleAlt", { id: img.id })}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        className="mt-8 bg-primary hover:bg-primary/90 rounded-full px-8 text-lg"
        style={{ width: '200px' }}
      >
        {t("dashboardV2.createHeadshots")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

// Gender Step
function GenderStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const options = [
    { value: "man", label: t("dashboardV2.male"), icon: "♂" },
    { value: "woman", label: t("dashboardV2.female"), icon: "♀" },
    { value: "non-binary", label: t("dashboardV2.nonBinary"), icon: "⚧" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourGender")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.genderDescription", { name: user?.name ? `, ${user.name}` : "" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-6 rounded-lg border-2 transition-all ${
              value === option.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            {isMobile ? (
              // Mobile: Icon, name, and selected indicator in same row
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-4xl flex-shrink-0">{option.icon}</span>
                  <p className="font-semibold text-left">{option.label}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                  value === option.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                }`}>
                  {value === option.value && (
                    <div className="w-full h-full rounded-full bg-primary" />
                  )}
                </div>
              </div>
            ) : (
              // Desktop: Original layout
              <>
            <div className="flex items-center justify-between">
              <span className="text-4xl">{option.icon}</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                value === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`}>
                {value === option.value && (
                  <div className="w-full h-full rounded-full bg-primary" />
                )}
              </div>
            </div>
            <p className="mt-4 font-semibold text-left">{option.label}</p>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Age Step
function AgeStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const ageRanges = ["18-20", "21-24", "25-29", "30-40", "41-50", "51-65", "65+"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.howOldAreYou")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ageDescription")}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {ageRanges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              value === range
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">{range}</span>
              <div className={`w-4 h-4 rounded-full border-2 ${
                value === range
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hair Color Step
function HairColorStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const colors = [
    { value: "brown", label: t("dashboardV2.brown"), color: "bg-amber-800" },
    { value: "black", label: t("dashboardV2.black"), color: "bg-black" },
    { value: "blonde", label: t("dashboardV2.blonde"), color: "bg-yellow-300" },
    { value: "gray", label: t("dashboardV2.gray"), color: "bg-gray-400" },
    { value: "auburn", label: t("dashboardV2.auburn"), color: "bg-red-800" },
    { value: "red", label: t("dashboardV2.red"), color: "bg-red-500" },
    { value: "white", label: t("dashboardV2.white"), color: "bg-white border" },
    { value: "other", label: t("dashboardV2.other"), color: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" },
    { value: "bald", label: t("dashboardV2.bald"), color: "bg-gray-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourHairColor")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairColorDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === color.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            {isMobile ? (
              // Mobile: Color swatch, name, and check in same row
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${color.color}`} />
                  <p className="text-sm font-semibold text-left">{color.label}</p>
                </div>
                {value === color.value && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            ) : (
              // Desktop: Original layout
              <>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-full ${color.color}`} />
              {value === color.value && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <p className="text-sm font-semibold text-left">{color.label}</p>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Hair Length Step
function HairLengthStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const lengths = [
    { value: "bald", label: t("dashboardV2.bald") },
    { value: "buzz", label: t("dashboardV2.buzzCut") },
    { value: "short", label: t("dashboardV2.short") },
    { value: "medium", label: t("dashboardV2.mediumLength") },
    { value: "long", label: t("dashboardV2.long") },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourHairLength")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairLengthDescription")}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mt-8">
        {lengths.map((length) => (
          <button
            key={length.value}
            onClick={() => onChange(length.value)}
            className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${
              value === length.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {value === length.value && (
                <Check className="h-5 w-5 text-primary mb-2" />
              )}
              <p className="text-sm font-semibold text-center">{length.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hair Style Step
function HairStyleStep({ value, onChange, onNext, formData }: { value: string; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const styles = [
    { value: "straight", label: t("dashboardV2.straight"), imageIndex: 1 },
    { value: "wavy", label: t("dashboardV2.wavy"), imageIndex: 2 },
    { value: "curly", label: t("dashboardV2.curly"), imageIndex: 3 },
    { value: "dreadlocks", label: t("dashboardV2.dreadlocks"), imageIndex: 4 },
  ];

  // Get gender from formData, default to "man"
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  
  // Function to get the hair type image path based on gender and image index
  const getHairTypeImage = (gender: string, imageIndex: number): string => {
    const genderPrefix = gender === "woman" ? "woman" : "man";
    let imageNumber: number | string;
    
    if (gender === "woman") {
      // For women: swap only straight (1) and wavy (2) images, keep others as before (reversed)
      // Original reverse: 1->4, 2->3, 3->2, 4->1
      // New: swap 1 and 2, keep 3 and 4 as original reverse
      // 1 (straight) -> 3 (was 4), 2 (wavy) -> 4 (was 3), 3 (curly) -> 2, 4 (dreadlocks) -> 1
      const womanMapping: Record<number, number> = {
        1: 3, // straight → woman_hair_type3.webp (was 4 in original reverse)
        2: 4, // wavy → woman_hair_type4.webp (was 3 in original reverse)
        3: 2, // curly → woman_hair_type2.webp (same as original reverse)
        4: 1, // dreadlocks → woman_hair_type.webp (same as original reverse)
      };
      const mappedIndex = womanMapping[imageIndex] || imageIndex;
      imageNumber = mappedIndex === 1 ? "" : mappedIndex;
    } else {
      // For men: 1->1 (straight), 2->4 (wavy uses dreadlocks), 3->2 (curly uses wavy), 4->3 (dreadlocks uses curly)
      const manMapping: Record<number, number> = {
        1: 1, // straight → man_hair_type.webp
        2: 4, // wavy → man_hair_type4.webp (was dreadlocks)
        3: 2, // curly → man_hair_type2.webp (was wavy)
        4: 3, // dreadlocks → man_hair_type3.webp (was curly)
      };
      const mappedIndex = manMapping[imageIndex] || imageIndex;
      imageNumber = mappedIndex === 1 ? "" : mappedIndex;
    }
    
    return `/${genderPrefix}_hair_type${imageNumber}.webp`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourHairType")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairTypeDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-8">
        {styles.map((style) => {
          const imageUrl = getHairTypeImage(gender, style.imageIndex);
          
          return (
            <button
              key={style.value}
              onClick={() => onChange(style.value)}
              className={`relative w-full aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${
                value === style.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Example image inside button */}
              <img
                src={imageUrl}
                alt={t("dashboardV2.exampleForAlt", { label: style.label })}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
              />
              {value === style.value && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary bg-background rounded-full p-1" />
                </div>
              )}
              {/* Label overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-sm font-semibold text-white text-center">{style.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Ethnicity Step
function EthnicityStep({ value, onChange, onNext, formData }: { value: string; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const ethnicities = [
    { value: "white", label: t("dashboardV2.whiteCaucasian") },
    { value: "black", label: t("dashboardV2.blackAfrican") },
    { value: "hispanic", label: t("dashboardV2.hispanicLatino") },
    { value: "asian-east", label: t("dashboardV2.asianEast") },
    { value: "asian-south", label: t("dashboardV2.asianSouth") },
    { value: "asian-southeast", label: t("dashboardV2.asianSoutheast") },
    { value: "middle-eastern", label: t("dashboardV2.middleEastern") },
    { value: "pacific-islander", label: t("dashboardV2.pacificIslander") },
    { value: "multiracial", label: t("dashboardV2.multiracial") },
    { value: "other", label: t("dashboardV2.other") },
  ];

  // Filter example images based on selected gender, attire (styles), and backgrounds
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedStyles = formData.attire || [];
  const selectedBackgrounds = formData.backgrounds || [];
  const filteredImages = filterExampleImages(exampleImages, gender, selectedStyles, selectedBackgrounds);
  const displayImages = filteredImages.length > 0 ? filteredImages.slice(0, 6) : exampleImages.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourEthnicity")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ethnicityDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
        {ethnicities.map((ethnicity) => (
          <button
            key={ethnicity.value}
            onClick={() => onChange(ethnicity.value)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === ethnicity.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{ethnicity.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                value === ethnicity.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Body Type Step
function BodyTypeStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const bodyTypes = [
    { value: "slim", label: t("dashboardV2.slim") },
    { value: "regular", label: t("dashboardV2.regular") },
    { value: "athletic", label: t("dashboardV2.athletic") },
    { value: "medium-large", label: t("dashboardV2.mediumLarge") },
    { value: "large", label: t("dashboardV2.large") },
    { value: "plus", label: t("dashboardV2.plusSize") },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.whatIsYourBodyType")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.bodyTypeDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mt-8">
        {bodyTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${
              value === type.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {value === type.value && (
                <Check className="h-5 w-5 text-primary mb-2" />
              )}
              <p className="text-xs font-semibold text-center">{type.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Attire Step
function AttireStep({ value, onChange, onNext, formData }: { value: string[]; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const attires = [
    { value: "professional", label: t("dashboardV2.professionalBusiness") || "Professional", description: t("dashboardV2.professionalBusinessDesc") || "Business professional attire" },
    { value: "casual", label: t("dashboardV2.casual") || "Casual", description: t("dashboardV2.casualDesc") || "Casual everyday wear" },
    { value: "elegant", label: t("dashboardV2.elegant") || "Elegant", description: t("dashboardV2.elegantDesc") || "Elegant and sophisticated style" },
    { value: "formal", label: t("dashboardV2.formal") || "Formal", description: t("dashboardV2.formalDesc") || "Formal and traditional attire" },
  ];

  // Filter example images based on selected gender and backgrounds only
  // Don't filter by current attire selection to keep images stable
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedBackgrounds = formData.backgrounds || [];
  // Filter by gender and backgrounds only, not by attire styles
  const filteredImages = filterExampleImages(exampleImages, gender, [], selectedBackgrounds);
  // Get first 4 images for the 4 attire options - these will be fixed
  const displayImages = filteredImages.length >= 4 
    ? filteredImages.slice(0, 4) 
    : (filteredImages.length > 0 ? filteredImages : exampleImages.slice(0, 4));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.selectYourAttire")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.attireDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {attires.map((attire, index) => {
          const isSelected = value.includes(attire.value);
          // Assign fixed images: each attire gets its corresponding image
          const exampleImage = displayImages[index] || displayImages[0];
          
          return (
            <button
              key={attire.value}
              onClick={() => onChange(attire.value)}
              className={`relative rounded-lg border-2 transition-all overflow-hidden flex flex-col ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Example image at the top */}
              <div className="w-full aspect-[3/4] relative overflow-hidden flex-shrink-0">
                <img
                  src={exampleImage.url}
                  alt={t("dashboardV2.exampleForAlt", { label: attire.label })}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-6 w-6 text-primary bg-background rounded-full p-1" />
                  </div>
                )}
              </div>
              {/* Label and description at the bottom */}
              <div className="p-4 flex-shrink-0">
                <h3 className="font-semibold text-lg mb-1">{attire.label}</h3>
                <p className="text-sm text-muted-foreground">{attire.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm text-muted-foreground">
          {t("dashboardV2.attireNote")}
        </p>
      </div>
    </div>
  );
}

// Background Step
function BackgroundStep({ value, onChange, onNext, formData }: { value: string[]; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const backgrounds = [
    { value: "city", label: t("dashboardV2.city"), description: t("dashboardV2.cityDesc") },
    { value: "nature", label: t("dashboardV2.nature"), description: t("dashboardV2.natureDesc") },
    { value: "office", label: t("dashboardV2.office"), description: t("dashboardV2.officeDesc") },
    { value: "studio", label: t("dashboardV2.studio"), description: t("dashboardV2.studioDesc") },
  ];

  // Use static images for background selection based on gender
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  
  // Static image mapping for men and women
  const staticBackgroundImages: Record<string, Record<string, string>> = {
    man: {
      city: "/image_selection/Man/39_man_city_casual.webp",
      nature: "/image_selection/Man/14_man_nature_elegant.webp",
      office: "/image_selection/Man/7_man_office_professional.webp",
      studio: "/image_selection/Man/9_man_studio_professional.webp",
    },
    woman: {
      city: "/image_selection/Woman/48_woman_city_casual.webp",
      nature: "/image_selection/Woman/28_woman_nature_professional.webp",
      office: "/image_selection/Woman/25_woman_office_professional.webp",
      studio: "/image_selection/Woman/7_woman_studio_professional.webp",
    },
  };
  
  // Get static image URL for a background
  const getStaticImageUrl = (bgValue: string): string => {
    return staticBackgroundImages[gender]?.[bgValue] || staticBackgroundImages.man[bgValue] || "";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.selectYourBackgrounds")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.backgroundDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        {backgrounds.map((bg, index) => {
          const isSelected = value.includes(bg.value);
          // Use static image URL based on gender and background
          const imageUrl = getStaticImageUrl(bg.value);
          
          return (
            <button
              key={bg.value}
              onClick={() => onChange(bg.value)}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Example image */}
              <div className="w-full aspect-[3/4] relative">
                <img
                  src={imageUrl}
                  alt={t("dashboardV2.exampleForAlt", { label: bg.label })}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary bg-background rounded-full p-0.5" />
                  </div>
                )}
              </div>
              {/* Label and description */}
              <div className="p-3">
                <h3 className="font-semibold mb-1">{bg.label}</h3>
                <p className="text-xs text-muted-foreground text-center">{bg.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Pricing Step - Only shown when user has no credits
function PricingStep({ 
  value, 
  onChange, 
  onNext, 
  formData,
  createCheckoutMutation,
  packs,
  isLoadingPacks,
}: { 
  value: string; 
  onChange: (value: "basic" | "standard" | "premium") => void; 
  onNext: () => void; 
  formData: any;
  createCheckoutMutation: ReturnType<typeof trpc.payment.createCheckoutSession.useMutation>;
  packs: any[] | undefined;
  isLoadingPacks: boolean;
}) {
  const { t, currentLanguage } = useTranslation();
  const [, setLocation] = useLocation();
  const [currency, setCurrency] = useState<Currency>(detectCurrency());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Update currency when language changes
  useEffect(() => {
    const newCurrency = detectCurrency();
    setCurrency(newCurrency);
  }, [currentLanguage]);
  
  const basicPrice = getPage2Price("basic", currency);
  const standardPrice = getPage2Price("standard", currency);
  const premiumPrice = getPage2Price("premium", currency);

  const plans = [
    {
      id: "basic" as const,
      name: t("dashboardV2.pricing.basic"),
      price: basicPrice,
      icon: <Sparkles className="h-6 w-6" />,
      features: [
        t("dashboardV2.pricing.basicFeature1"),
        t("dashboardV2.pricing.basicFeature2"),
        t("dashboardV2.pricing.basicFeature3"),
      ],
    },
    {
      id: "standard" as const,
      name: t("dashboardV2.pricing.standard"),
      price: standardPrice,
      icon: <Star className="h-6 w-6" />,
      features: [
        t("dashboardV2.pricing.standardFeature1"),
        t("dashboardV2.pricing.standardFeature2"),
        t("dashboardV2.pricing.standardFeature3"),
      ],
      popular: true,
    },
    {
      id: "premium" as const,
      name: t("dashboardV2.pricing.premium"),
      price: premiumPrice,
      icon: <Zap className="h-6 w-6" />,
      features: [
        t("dashboardV2.pricing.premiumFeature1"),
        t("dashboardV2.pricing.premiumFeature2"),
        t("dashboardV2.pricing.premiumFeature3"),
      ],
    },
  ];

  // Map plan to pack ID by matching the expected price (in USD cents)
  const getPackIdByPlan = (plan: "basic" | "standard" | "premium"): number | null => {
    if (!packs || packs.length === 0) return null;
    
    // Get the price object that's actually displayed in the UI
    const displayedPrice = plan === "basic" ? basicPrice : plan === "standard" ? standardPrice : premiumPrice;
    
    // Use the displayed price amount (what user sees and will pay)
    // This accounts for currency conversion if needed
    const expectedPriceCents = displayedPrice.amount; // Already in cents, already converted to user's currency
    
    // Also get the old price (price before discount) - packs in database might have this price
    const oldPriceCents = displayedPrice.oldAmount || null; // Old price in user's currency
    
    // Also get the USD base price for logging
    const basePriceCentsUSD = PAGE2_PRICES[plan];
    const oldBasePriceCentsUSD = PAGE2_OLD_PRICES[plan];
    
    // Use same price for EUR as USD (no conversion)
    const currency = detectCurrency();
    const expectedPriceInCurrencyUSD = basePriceCentsUSD;
    const oldPriceInCurrencyUSD = oldBasePriceCentsUSD;
    
    // Removed console.log for production
    
    // First, try to find exact match using the displayed price (what user will actually pay)
    // This ensures we match the pack with the price the user sees in the UI
    let matchedPack = packs.find(p => {
      const packPrice = parseFloat(p.price.toString());
      const packPriceCents = Math.round(packPrice * 100);
      const difference = Math.abs(packPriceCents - expectedPriceCents);
      const isMatch = difference <= 1; // Allow 1 cent tolerance
      
      return isMatch;
    });
    
    // If not found with current price, try old price (packs in database might have the old price)
    if (!matchedPack && oldPriceCents) {
      matchedPack = packs.find(p => {
        const packPrice = parseFloat(p.price.toString());
        const packPriceCents = Math.round(packPrice * 100);
        const difference = Math.abs(packPriceCents - oldPriceCents);
        const isMatch = difference <= 1; // Allow 1 cent tolerance
        
        return isMatch;
      });
    }
    
    if (matchedPack) {
      return matchedPack.id;
    }
    
    // Fallback: Find pack closest to expected price (not just first in order)
    console.warn(`[DashboardV2] ⚠️ No exact pack match found for "${plan}" (expected ${expectedPriceCents} cents in ${currency} = ${displayedPrice.formatted}). Finding closest match...`);
    
    // Calculate distance from expected price for each pack (using both current and old price)
    const packsWithDistance = packs.map(p => {
      const packPrice = parseFloat(p.price.toString());
      const packPriceCents = Math.round(packPrice * 100);
      // Calculate distance from both current and old price, use the smaller distance
      const distanceFromCurrent = Math.abs(packPriceCents - expectedPriceCents);
      const distanceFromOld = oldPriceCents ? Math.abs(packPriceCents - oldPriceCents) : Infinity;
      const distance = Math.min(distanceFromCurrent, distanceFromOld);
      return { pack: p, distance, priceCents: packPriceCents, distanceFromCurrent, distanceFromOld };
    });
    
    // Sort by distance (closest first)
    packsWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Find the best match based on expected position (basic = cheapest, standard = middle, premium = most expensive)
    const sortedByPrice = [...packs].sort((a, b) => {
      const priceA = parseFloat(a.price.toString());
      const priceB = parseFloat(b.price.toString());
      return priceA - priceB;
    });
    
    // For page2, always use order-based mapping as fallback (same as BuyCredits)
    // But prefer packs that are closest to expected price within reasonable range
    let selectedPack;
    
    // Always prefer the closest pack to expected price (within reasonable range)
    const closestToExpected = packsWithDistance[0];
    const MAX_ACCEPTABLE_DISTANCE = 500; // $5 = 500 cents
    
    if (closestToExpected && closestToExpected.distance <= MAX_ACCEPTABLE_DISTANCE) {
      // Found a pack reasonably close to expected price - use it
      selectedPack = closestToExpected.pack;
    } else {
      // No pack close enough - use order-based mapping as last resort
      console.error(`[DashboardV2] ❌ No pack found close to expected price for "${plan}" (expected ${expectedPriceCents} cents = ${displayedPrice.formatted}, closest is ${closestToExpected?.distance || 'N/A'} cents away). Using order-based mapping as fallback.`);
      
      if (plan === "basic" && sortedByPrice.length >= 1) {
        selectedPack = sortedByPrice[0];
      } else if (plan === "standard" && sortedByPrice.length >= 2) {
        selectedPack = sortedByPrice[1];
      } else if (plan === "premium") {
        if (sortedByPrice.length >= 3) {
          selectedPack = sortedByPrice[2];
        } else if (sortedByPrice.length >= 2) {
          selectedPack = sortedByPrice[1];
        } else {
          selectedPack = sortedByPrice[0];
        }
      }
    }
    
    return selectedPack?.id || null;
  };

  const handlePurchase = async () => {
    if (!value || isProcessing || isLoadingPacks) return;
    
    const plan = value as "basic" | "standard" | "premium";
    const packId = getPackIdByPlan(plan);
    
    if (!packId) {
      toast.error(t("buyCredits.packNotFound") || "Pack not found", {
        description: t("generateImages.pleaseTryAgain") || "Please try again",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Check if we have a generation intent (user came from upload step with no credits)
      // If so, ensure it's preserved and updated with selected price before redirecting to checkout
      const existingIntent = safeLocalStorage.getItem("dashboardV2_generationIntent");
      if (existingIntent) {
        try {
          const intent = JSON.parse(existingIntent);
          // Update the selectedPrice in the intent to match what user selected
          const updatedIntent = {
            ...intent,
            selectedPrice: plan,
            formData: {
              ...intent.formData,
              selectedPrice: plan,
            },
          };
          safeLocalStorage.setItem("dashboardV2_generationIntent", JSON.stringify(updatedIntent));
          console.log("[DashboardV2 PricingStep] Updated generation intent with selected price:", plan);
        } catch (e) {
          console.error("[DashboardV2 PricingStep] Failed to update generation intent:", e);
        }
      }
      
      // Save form data to localStorage so we can resume after purchase
      // User will continue to upload step after payment (not generate, since files aren't uploaded yet)
      const dataToSave = {
        ...formData,
        selectedPrice: plan,
        resumeStep: "upload", // After payment, go to upload step
        currentStep: "pricing",
      };
      safeLocalStorage.setItem("dashboardV2_formData", JSON.stringify(dataToSave));
      
      // Directly create checkout session and redirect to Stripe
      
      const result = await createCheckoutMutation.mutateAsync({ 
        packId,
        currency: currency,
        variant: "page2",
      });
      
      
      if (result?.url) {
        // Redirect directly to Stripe Checkout
        window.location.href = result.url;
      } else {
        console.error("[DashboardV2] No URL in checkout result:", result);
        toast.error(t("buyCredits.checkoutFailed") || "Failed to create checkout session");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("[DashboardV2] Checkout error:", error);
      toast.error(error?.message || t("buyCredits.checkoutStartFailed") || "Failed to start checkout");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold break-words">{t("dashboardV2.pricing.title")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.pricing.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-8">
        {plans.map((plan) => {
          const isSelected = value === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => onChange(plan.id)}
              className={`relative p-3 sm:p-4 md:p-6 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              } ${plan.popular ? "ring-2 ring-primary/20" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {t("dashboardV2.pricing.popular")}
                  </span>
                </div>
              )}
              
              <div className="flex flex-row md:flex-col gap-3">
                {/* Left side: Icon, Name, Price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                      <div className="text-primary shrink-0 text-sm sm:text-base">{plan.icon}</div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold break-words">{plan.name}</h3>
                </div>
                {isSelected && (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                )}
              </div>

                  <div className="mb-2 sm:mb-4">
                {plan.price.oldFormatted && (
                      <div className="text-sm sm:text-lg text-muted-foreground line-through mb-0.5">
                    {plan.price.oldFormatted}
                  </div>
                )}
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-words">
                  {plan.price.formatted}
                </div>
                  </div>
                </div>

                {/* Right side: Discounted + Features (mobile only) */}
                <div className="md:hidden flex flex-col items-end justify-start shrink-0">
                {plan.price.oldFormatted && (
                    <div className="text-xs text-green-400 font-semibold mb-2">
                    {t("dashboardV2.pricing.discounted")}
                  </div>
                )}
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs text-muted-foreground text-right">{feature}</span>
                        <Check className="h-3 w-3 text-green-400 shrink-0" />
                      </li>
                    ))}
                  </ul>
              </div>

                {/* Desktop: Discounted and Features below price */}
                <div className="hidden md:block">
                  {plan.price.oldFormatted && (
                    <div className="text-xs sm:text-sm text-green-400 font-semibold mt-0.5 mb-2 sm:mb-4">
                      {t("dashboardV2.pricing.discounted")}
                    </div>
                  )}
                  <ul className="space-y-1 sm:space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Money-Back Guarantee */}
      <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-border">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          {t("buyCredits.moneyBackGuarantee")}
        </p>
      </div>
    </div>
  );
}

// Upload Step
function UploadStep({ 
  onNext,
  uploadedFiles,
  setUploadedFiles,
  isDragging,
  setIsDragging,
  fileInputRef,
  user,
  formData,
  generateFromPage2Mutation,
}: { 
  onNext: () => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  user: any;
  formData: any;
  generateFromPage2Mutation: ReturnType<typeof trpc.photo.generateFromPage2.useMutation>;
}) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const maxFiles = 10;
  const maxFileSize = 120 * 1024 * 1024; // 120MB
  
  // Define mutation directly in component (safer for production - always available)
  const uploadPage2ImagesMutation = trpc.photo.uploadPage2Images.useMutation();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const newFiles: UploadedFile[] = [];
    const currentCount = uploadedFiles.length;
    const totalFiles = currentCount + files.length;

    // Check total files limit
    if (totalFiles > maxFiles) {
      toast.error(t("dashboardV2.maxFilesError"), {
        description: t("dashboardV2.maxFilesErrorDesc", { maxFiles, currentCount, newCount: files.length }),
      });
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Check if we've reached the limit
      if (currentCount + newFiles.length >= maxFiles) {
        toast.error(t("dashboardV2.maxFilesError"), {
          description: t("dashboardV2.maxFilesErrorDescSimple", { maxFiles }),
        });
        break;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error(t("dashboardV2.invalidFileType"), {
          description: t("dashboardV2.invalidFileTypeDesc", { fileName: file.name }),
        });
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(t("dashboardV2.fileTooLarge"), {
          description: t("dashboardV2.fileTooLargeDesc", { fileName: file.name }),
        });
        continue;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      newFiles.push({ id, file, preview });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(
        `${newFiles.length} ${newFiles.length === 1 ? t("dashboardV2.fileSelected") : t("dashboardV2.filesSelected")}`,
        {
          description: t("dashboardV2.filesReady"),
        }
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    toast.success(t("dashboardV2.fileRemoved"));
  };

  // Filter example images based on selected gender, attire (styles), and backgrounds
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedStyles = formData.attire || [];
  const selectedBackgrounds = formData.backgrounds || [];
  const filteredImages = filterExampleImages(exampleImages, gender, selectedStyles, selectedBackgrounds);
  const displayImages = filteredImages.length > 0 ? filteredImages.slice(0, 6) : exampleImages.slice(0, 6);

  return (
    <div className={isMobile ? "space-y-4" : "space-y-6"}>
      <div className={`text-center ${isMobile ? "space-y-1" : "space-y-2"}`}>
        <h2 className={`${isMobile ? "text-xl" : "text-2xl sm:text-3xl"} font-bold break-words`}>{t("dashboardV2.uploadPhotos")}</h2>
        <p className={`${isMobile ? "text-sm" : ""} text-muted-foreground`}>
          {t("dashboardV2.uploadDescription")}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg transition-colors ${
          isMobile 
            ? `p-4 ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`
            : `p-12 text-center mt-8 ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        {isMobile ? (
          // Mobile: Compact horizontal layout
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("dashboardV2.uploadFiles")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("dashboardV2.uploadFormats")}
            </p>
          </div>
        ) : (
          // Desktop: Original vertical layout
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">{t("dashboardV2.uploadFromComputer")}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          {t("dashboardV2.uploadFiles")}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          {t("dashboardV2.uploadFormats")}
        </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">
              {t("dashboardV2.uploadedImages")} {uploadedFiles.length} {t("dashboardV2.of")} {maxFiles}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
                setUploadedFiles([]);
              }}
            >
              {t("dashboardV2.clearAll")}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border">
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate" title={uploadedFile.file.name}>
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} {t("dashboardV2.fileSizeUnit")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {t("dashboardV2.uploadedImages")} 0 {t("dashboardV2.of")} {maxFiles}
          </p>
        </div>
      )}
    </div>
  );
}

