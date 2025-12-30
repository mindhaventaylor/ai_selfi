import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { LoginModal } from "@/components/LoginModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_LOGO } from "@/const";
import { 
  Upload,
  X,
  User,
  Settings,
  HelpCircle,
  Image as ImageIcon,
  CreditCard,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Check,
  Loader2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exampleImages } from "@/data/exampleImages";
import { detectCurrency, getPage2Price, PAGE2_PRICES, PAGE2_CREDITS, type Currency } from "@/utils/currency";
import { safeLocalStorage } from "@/utils/localStorage";

// Types
type Tab = "woman" | "man" | "custom";
type CustomPreset = "professional" | "business" | "id_photo";
type View = "hero" | "create";

type V3StyleCard = {
  label: string;
  exampleImageId: number;
};

// Hero example images (3 images for the hero section)
const heroExampleImages = [
  "/image_selection/Man/1_man_office_elegant.webp",
  "/image_selection/Woman/2_woman_studio_casual.webp",
  "/image_selection/Man/21_man_city_professional.webp",
];

export default function DashboardV3() {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
  // View state - "hero" shows landing page, "create" shows the form
  const [view, setView] = useState<View>("hero");
  
  // State
  const [uploadedFile, setUploadedFile] = useState<{ file: File; preview: string } | null>(null);
  const [tab, setTab] = useState<Tab>("woman");
  const [selectedExampleImageId, setSelectedExampleImageId] = useState<number | null>(46);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pricing modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "standard" | "premium">("standard");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currency, setCurrency] = useState<Currency>(detectCurrency());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Mutations
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();
  const generateMutation = trpc.photo.generate.useMutation();
  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  
  // Queries
  const { data: packs, isLoading: isLoadingPacks } = trpc.payment.listPacks.useQuery();

  // Update currency when language changes
  useEffect(() => {
    setCurrency(detectCurrency());
  }, [currentLanguage]);

  // Restore state after login - check if we have a pending action saved
  useEffect(() => {
    const savedData = safeLocalStorage.getItem("dashboardV3_formData");
    const pendingLogin = safeLocalStorage.getItem("dashboardV3_pendingLogin");
    const generationIntent = safeLocalStorage.getItem("dashboardV3_generationIntent");
    
    if (savedData && pendingLogin === "true") {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.tab) setTab(parsed.tab);
        if (parsed.selectedExampleImageId) setSelectedExampleImageId(parsed.selectedExampleImageId);
        if (parsed.customPrompt) setCustomPrompt(parsed.customPrompt);
        if (parsed.selectedPlan) setSelectedPlan(parsed.selectedPlan);
        // Restore to create view
        setView("create");
        
        // Restore uploaded file preview from generation intent
        if (generationIntent && !uploadedFile) {
          try {
            const intent = JSON.parse(generationIntent);
            if (intent.userImageBase64 && intent.fileName) {
              // Convert base64 back to File and create preview
              const byteString = atob(intent.userImageBase64);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: 'image/jpeg' });
              const file = new File([blob], intent.fileName, { type: 'image/jpeg' });
              const preview = URL.createObjectURL(blob);
              setUploadedFile({ file, preview });
            }
          } catch (e) {
            console.error("[DashboardV3] Failed to restore uploaded file:", e);
          }
        }
        
        // Clear the pending login flag
        safeLocalStorage.removeItem("dashboardV3_pendingLogin");
        
        // If user is now logged in but has no credits, show pricing modal
        if (user && (user.credits || 0) < 4) {
          // Small delay to ensure state is set
          setTimeout(() => {
            setShowPricingModal(true);
          }, 100);
        }
      } catch (e) {
        console.error("[DashboardV3] Failed to restore state after login:", e);
        safeLocalStorage.removeItem("dashboardV3_pendingLogin");
      }
    }
  }, [user, uploadedFile]); // Re-run when user changes (after login)

  // Handle payment cancellation - show toast and restore state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    
    if (paymentStatus === "cancelled") {
      // Show toast notification
      toast.error(t("payment.cancel.title") || "Payment cancelled", {
        description: t("payment.cancel.message") || "Your payment was not completed. You can try again when you're ready.",
      });
      
      // Restore form data if available
      const savedData = safeLocalStorage.getItem("dashboardV3_formData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.tab) setTab(parsed.tab);
          if (parsed.selectedExampleImageId) setSelectedExampleImageId(parsed.selectedExampleImageId);
          if (parsed.customPrompt) setCustomPrompt(parsed.customPrompt);
          if (parsed.selectedPlan) setSelectedPlan(parsed.selectedPlan);
          // Switch to create view to show the form
          setView("create");
        } catch (e) {
          console.error("[DashboardV3] Failed to parse saved form data:", e);
        }
      }
      
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [t]);

  // Pricing
  const basicPrice = getPage2Price("basic", currency);
  const standardPrice = getPage2Price("standard", currency);
  const premiumPrice = getPage2Price("premium", currency);

  const plans = [
    {
      id: "basic" as const,
      name: t("dashboardV3.pricing.plans.basic"),
      price: basicPrice,
      credits: PAGE2_CREDITS.basic,
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: "standard" as const,
      name: t("dashboardV3.pricing.plans.standard"),
      price: standardPrice,
      credits: PAGE2_CREDITS.standard,
      icon: <Star className="h-5 w-5" />,
      popular: true,
    },
    {
      id: "premium" as const,
      name: t("dashboardV3.pricing.plans.premium"),
      price: premiumPrice,
      credits: PAGE2_CREDITS.premium,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  // Custom presets
  const presets: Record<CustomPreset, { label: string; prompt: string }> = {
    professional: {
      label: t("dashboardV3.create.customTab.presets.professional.label"),
      prompt: t("dashboardV3.create.customTab.presets.professional.prompt")
    },
    business: {
      label: t("dashboardV3.create.customTab.presets.business.label"),
      prompt: t("dashboardV3.create.customTab.presets.business.prompt")
    },
    id_photo: {
      label: t("dashboardV3.create.customTab.presets.idPhoto.label"),
      prompt: t("dashboardV3.create.customTab.presets.idPhoto.prompt")
    }
  };

  const styleCards = useMemo(() => {
    const manCards: V3StyleCard[] = [
      { label: t("dashboardV3.create.styles.academic"), exampleImageId: 1 },
      { label: t("dashboardV3.create.styles.business"), exampleImageId: 4 },
      { label: t("dashboardV3.create.styles.casual"), exampleImageId: 5 },
      { label: t("dashboardV3.create.styles.energetic"), exampleImageId: 20 },
      { label: t("dashboardV3.create.styles.idPhoto"), exampleImageId: 23 },
      { label: t("dashboardV3.create.styles.modern"), exampleImageId: 17 },
      { label: t("dashboardV3.create.styles.professional"), exampleImageId: 7 },
      { label: t("dashboardV3.create.styles.sepia"), exampleImageId: 10 },
      { label: t("dashboardV3.create.styles.sophisticated"), exampleImageId: 13 },
    ];

    const womanCards: V3StyleCard[] = [
      { label: t("dashboardV3.create.styles.academic"), exampleImageId: 62 },
      { label: t("dashboardV3.create.styles.business"), exampleImageId: 56 },
      { label: t("dashboardV3.create.styles.casual"), exampleImageId: 64 },
      { label: t("dashboardV3.create.styles.professional"), exampleImageId: 52 },
      { label: t("dashboardV3.create.styles.energetic"), exampleImageId: 55 },
      { label: t("dashboardV3.create.styles.idPhoto"), exampleImageId: 51 },
      { label: t("dashboardV3.create.styles.modern"), exampleImageId: 54 },
      { label: t("dashboardV3.create.styles.sophisticated"), exampleImageId: 60 },
      { label: t("dashboardV3.create.styles.sepia"), exampleImageId: 61 },
    ];

    return tab === "man" ? manCards : womanCards;
  }, [tab, t]);

  const selectedExampleImage = useMemo(() => {
    if (tab === "custom") return null;
    const fallbackId = tab === "man" ? 1 : 46;
    const id = selectedExampleImageId ?? fallbackId;
    return exampleImages.find((img) => img.id === id) ?? exampleImages.find((img) => img.id === fallbackId) ?? null;
  }, [selectedExampleImageId, tab]);

  // Tell DashboardLayout to hide header/sidebar when in create view
  useEffect(() => {
    if (view === "create") {
      window.dispatchEvent(new CustomEvent('aiselfi-dashboard-layout-mode', { 
        detail: { showFullLayout: false } 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('aiselfi-dashboard-layout-mode', { 
        detail: { showFullLayout: true } 
      }));
    }
  }, [view]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview);
      }
    };
  }, [uploadedFile]);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
    const maxFileSize = 16 * 1024 * 1024;

    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error(t("dashboardV2.invalidFileType") || "Invalid file type");
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(t("dashboardV2.fileTooLarge") || "File too large");
      return;
    }

    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }

    const preview = URL.createObjectURL(file);
    setUploadedFile({ file, preview });
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

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview);
      setUploadedFile(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get pack ID by plan
  const getPackIdByPlan = (plan: "basic" | "standard" | "premium"): number | null => {
    if (!packs || packs.length === 0) return null;
    
    const displayedPrice = plan === "basic" ? basicPrice : plan === "standard" ? standardPrice : premiumPrice;
    const expectedPriceCents = displayedPrice.amount;
    
    // Try exact match
    let matchedPack = packs.find((p: any) => {
      const packPrice = parseFloat(p.price.toString());
      const packPriceCents = Math.round(packPrice * 100);
      return Math.abs(packPriceCents - expectedPriceCents) <= 1;
    });
    
    if (matchedPack) return matchedPack.id;
    
    // Fallback: order-based
    const sortedByPrice = [...packs].sort((a: any, b: any) => {
      return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
    });
    
    if (plan === "basic" && sortedByPrice.length >= 1) return sortedByPrice[0].id;
    if (plan === "standard" && sortedByPrice.length >= 2) return sortedByPrice[1].id;
    if (plan === "premium" && sortedByPrice.length >= 3) return sortedByPrice[2].id;
    
    return sortedByPrice[0]?.id || null;
  };

  // Handle purchase - Upload image first to avoid 413 error
  const handlePurchase = async () => {
    if (isProcessingPayment || isLoadingPacks) return;
    
    // Check if user is authenticated before proceeding to payment
    if (!user) {
      // Save current state and redirect to login
      const currentPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams(window.location.search);
      const returnUrl = `${currentPath.split("?")[0]}?${params.toString()}`;
      
      // Save form data to resume after login
      const dataToSave = {
        variant: "page3",
        tab,
        selectedExampleImageId,
        customPrompt,
        selectedPlan,
      };
      safeLocalStorage.setItem("dashboardV3_formData", JSON.stringify(dataToSave));
      
      // Save uploaded file if exists
      if (uploadedFile?.file) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile.file);
        });
        
        const generationIntent = {
          resumeStep: "purchase",
          userImageBase64: base64Data,
          fileName: uploadedFile.file.name,
          formData: {
            tab,
            selectedExampleImageId,
            customPrompt,
            selectedPlan,
          },
          selectedPrice: selectedPlan,
        };
        safeLocalStorage.setItem("dashboardV3_generationIntent", JSON.stringify(generationIntent));
      }
      
      setLocation(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    const packId = getPackIdByPlan(selectedPlan);
    if (!packId) {
      toast.error(t("dashboardV3.create.errors.packNotFound"));
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Step 1: Upload image first to get URL (avoids 413 Content Too Large error)
      let uploadedImageUrl: string | null = null;
      if (uploadedFile?.file) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile.file);
        });

        const uploadResult = await uploadImagesMutation.mutateAsync({
          images: [{
            data: base64Data,
            fileName: uploadedFile.file.name,
            contentType: uploadedFile.file.type
          }]
        });

        if (!uploadResult.urls || uploadResult.urls.length === 0) {
          throw new Error("Failed to upload image");
        }

        uploadedImageUrl = uploadResult.urls[0];
      }
      
      // Save generation intent with uploaded image URL for auto-generation after payment
      if (uploadedImageUrl) {
        const generationIntent = {
          resumeStep: "generate",
          userImageUrl: uploadedImageUrl, // Save URL instead of base64
          formData: {
            tab,
            selectedExampleImageId,
            customPrompt,
            selectedPlan,
          },
          selectedPrice: selectedPlan,
        };
        safeLocalStorage.setItem("dashboardV3_generationIntent", JSON.stringify(generationIntent));
      }
      
      // Save form data to resume after payment
      const dataToSave = {
        variant: "page3",
        tab,
        selectedExampleImageId,
        customPrompt,
        selectedPlan,
      };
      safeLocalStorage.setItem("dashboardV3_formData", JSON.stringify(dataToSave));
      
      const result = await createCheckoutMutation.mutateAsync({ 
        packId,
        currency,
        variant: "page3",
      });
      
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error(t("dashboardV3.create.errors.checkoutError"));
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      toast.error(error?.message || t("dashboardV3.create.errors.checkoutError"));
      setIsProcessingPayment(false);
    }
  };

  // Generate handler
  const handleGenerate = async () => {
    // Prevent multiple clicks
    if (isGenerating) {
      return;
    }

    const isMissingImage = !uploadedFile;
    const isMissingStyle = (tab === "custom" && !customPrompt.trim()) || (tab !== "custom" && !selectedExampleImage);

    if (isMissingImage && isMissingStyle) {
      toast.error(t("dashboardV3.create.errors.missingRequirements"));
      return;
    }

    if (isMissingImage) {
      toast.error(t("dashboardV3.create.errors.uploadFirst"));
      return;
    }

    if (!user) {
      // Save current state before showing login modal
      const dataToSave = {
        variant: "page3",
        tab,
        selectedExampleImageId,
        customPrompt,
        selectedPlan,
      };
      safeLocalStorage.setItem("dashboardV3_formData", JSON.stringify(dataToSave));
      safeLocalStorage.setItem("dashboardV3_pendingLogin", "true");
      
      // Save uploaded file for restoration after login
      if (uploadedFile?.file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          
          const generationIntent = {
            resumeStep: "generate",
            userImageBase64: base64,
            fileName: uploadedFile.file.name,
            formData: dataToSave,
            selectedPrice: selectedPlan,
          };
          safeLocalStorage.setItem("dashboardV3_generationIntent", JSON.stringify(generationIntent));
        };
        reader.readAsDataURL(uploadedFile.file);
      }
      
      // Show login modal
      setPendingAction(() => () => handleGenerate());
      setShowLoginModal(true);
      return;
    }

    if (isMissingStyle) {
      if (tab === "custom") {
        toast.error(t("dashboardV3.create.errors.promptFirst"));
      } else {
        toast.error(t("dashboardV3.create.errors.styleFirst"));
      }
      return;
    }

    // Check credits - if insufficient, save data and show pricing modal
    const creditsNeeded = 4; // 4 images generated
    if ((user.credits || 0) < creditsNeeded) {
      // Save form data for restoration after payment
      const dataToSave = {
        variant: "page3",
        tab,
        selectedExampleImageId,
        customPrompt,
        selectedPlan,
      };
      safeLocalStorage.setItem("dashboardV3_formData", JSON.stringify(dataToSave));
      
      // Save generation intent with uploaded file for auto-generation after payment
      if (uploadedFile?.file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          
          const generationIntent = {
            resumeStep: "generate",
            userImageBase64: base64,
            fileName: uploadedFile.file.name,
            formData: {
              tab,
              selectedExampleImageId,
              customPrompt,
              selectedPlan,
            },
            selectedPrice: selectedPlan,
          };
          safeLocalStorage.setItem("dashboardV3_generationIntent", JSON.stringify(generationIntent));
        };
        reader.readAsDataURL(uploadedFile.file);
      }
      
      setShowPricingModal(true);
      return;
    }

    // Proceed with generation
    setIsGenerating(true);
    await startGeneration();
    // Note: If generation succeeds, we redirect and component unmounts
    // If generation fails, startGeneration will set isGenerating to false
  };

  const startGeneration = async () => {
    if (!uploadedFile || !user) {
      setIsGenerating(false);
      return;
    }

    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading(t("dashboardV3.create.preparing"));

      // 1) Upload image
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile.file);
      });

      const uploadResult = await uploadImagesMutation.mutateAsync({
        images: [{
          data: base64Data,
          fileName: uploadedFile.file.name,
          contentType: uploadedFile.file.type
        }]
      });

      if (!uploadResult.urls || uploadResult.urls.length === 0) {
        throw new Error("Failed to upload image");
      }

      const trainingImageUrls = [uploadResult.urls[0]];

      // 2) Build base prompt
      const promptBody = tab === "custom"
        ? customPrompt.trim()
        : (selectedExampleImage?.prompt || "A professional headshot in a studio setting with soft, even lighting.");

      const selectedUrl =
        tab === "custom"
          ? (selectedExampleImage?.url ?? "/image_selection/Man/1_man_office_elegant.webp")
          : (selectedExampleImage?.url ?? "/image_selection/Man/1_man_office_elegant.webp");

      let absoluteUrl = selectedUrl;
      if (!selectedUrl.startsWith("http")) {
        const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
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

      toast.dismiss(loadingToast);

      if (result.batchId) {
        toast.success(t("dashboardV3.create.success"));
        // Navigate to generate page with batchId - this will show the generation modal
        // When closed, it will redirect to gallery
        // Note: Component will unmount on redirect, so isGenerating doesn't need to be reset
        setLocation(`/dashboard/generate?variant=page3&batchId=${result.batchId}`);
      }
    } catch (error: any) {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error(error?.message || t("dashboardV3.create.errors.generationFailed"));
      setIsGenerating(false); // Allow retry on error
    }
  };

  // ============ HERO VIEW ============
  if (view === "hero") {
    return (
      <div className="bg-gray-900 min-h-[calc(100vh-56px)]">
        {/* Desktop Header with Credits */}
        {!isMobile && (
          <div className="sticky top-0 z-40 border-b border-gray-700 bg-gray-900/95 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={APP_LOGO} alt="AISelfie" className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-lg bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                  Alselfie
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full px-4 gap-2 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
                  onClick={() => setLocation("/dashboard/credits/buy?variant=page3")}
                >
                  <Clock className="h-4 w-4 text-white" />
                  <span>{t("dashboardLayout.creditsLabel")}: {user?.credits ?? 0}</span>
                </Button>
                {user && (
                  <button
                    onClick={() => setLocation("/dashboard/settings/general?variant=page3")}
                    className="h-9 w-9 rounded-full border-2 border-gray-700 hover:ring-2 hover:ring-primary transition-all overflow-hidden bg-gray-800 flex items-center justify-center"
                  >
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user?.name || "User"} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className={cn("mx-auto w-full max-w-lg px-6 flex flex-col items-center", isMobile ? "pt-8 pb-32" : "py-16")}>
          {/* Hero Card */}
          <div className="w-full rounded-3xl border border-gray-700 bg-gray-800 p-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t("dashboardV3.hero.title")}
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              {t("dashboardV3.hero.subtitle")}
            </p>
            
            {/* Example Images */}
            <div className="flex justify-center gap-3 mb-10">
              {heroExampleImages.map((src, idx) => (
                <div 
                  key={idx} 
                  className="w-28 h-36 md:w-32 md:h-44 rounded-2xl overflow-hidden border border-gray-700 shadow-lg"
                >
                  <img 
                    src={src} 
                    alt={`Example ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button 
              size="lg"
              className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 text-lg font-semibold shadow-lg gap-2"
              onClick={() => setView("create")}
            >
              {t("dashboardV3.hero.cta")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Bottom Navigation (Mobile) */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 shadow-lg">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-end justify-around relative">
                <button
                  onClick={() => setLocation("/dashboard/start?variant=page3")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors min-w-[50px]"
                  aria-label={t("dashboardV3.nav.start")}
                >
                  <HelpCircle className="h-6 w-6 text-gray-300" />
                  <span className="text-xs text-gray-300">{t("dashboardV3.nav.start")}</span>
                </button>

                <button
                  onClick={() => setLocation("/dashboard/gallery?variant=page3")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors min-w-[50px]"
                  aria-label={t("dashboardV3.nav.gallery")}
                >
                  <ImageIcon className="h-6 w-6 text-gray-300" />
                  <span className="text-xs text-gray-300">{t("dashboardV3.nav.gallery")}</span>
                </button>

                <button
                  onClick={() => setView("create")}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                  aria-label="Create"
                >
                  <Plus className="h-7 w-7" />
                </button>

                <button
                  onClick={() => setLocation("/dashboard/credits/buy?variant=page3")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors min-w-[50px]"
                  aria-label={t("dashboardV3.nav.credits")}
                >
                  <CreditCard className="h-6 w-6 text-gray-300" />
                  <span className="text-xs text-gray-300">{t("dashboardV3.nav.credits")}</span>
                </button>

                <button
                  onClick={() => setLocation("/dashboard/settings/general?variant=page3")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors min-w-[50px]"
                  aria-label={t("dashboardV3.nav.settings")}
                >
                  <Settings className="h-6 w-6 text-gray-300" />
                  <span className="text-xs text-gray-300">{t("dashboardV3.nav.settings")}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ CREATE VIEW (no header/navbar) ============
  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className={cn("mx-auto px-4 py-3 flex items-center", isMobile ? "max-w-md" : "max-w-6xl")}>
          <button
            onClick={() => setView("hero")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">{t("dashboardV3.create.back")}</span>
          </button>
        </div>
      </div>

      <div className={cn("mx-auto w-full px-4", isMobile ? "max-w-md pt-4 pb-8" : "max-w-6xl py-8")}>
        <div className={cn(!isMobile && "grid grid-cols-12 gap-10")}>
          
          {/* LEFT COLUMN: Upload (Desktop only, or Mobile after controls) */}
          {!isMobile && (
            <div className={cn("col-span-5 lg:col-span-4")}>
              <div className={cn("sticky top-24")}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">{t("dashboardV3.create.uploadTitle")}</h2>
                  <p className="text-gray-300 mt-1">
                    {t("dashboardV3.create.uploadSubtitle")}
                  </p>
                </div>
                
                {/* Upload Section */}
                <div 
                  className={cn(
                    "relative w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-gray-700 hover:border-primary/50",
                    "aspect-[3/4] max-h-[500px]"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />

                  {uploadedFile ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                      <img
                        src={uploadedFile.preview}
                        alt="Upload"
                        className="h-full max-h-full w-auto max-w-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-gray-800/90 border border-gray-700 shadow flex items-center justify-center hover:bg-gray-800 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      <div className={cn("rounded-full bg-primary/10 flex items-center justify-center mb-4", "w-16 h-16")}>
                        <Upload className={cn("text-primary", "h-8 w-8")} />
                      </div>
                      <h3 className={cn("font-semibold mb-1 text-white", "text-lg")}>
                        {t("dashboardV3.create.dragDrop")}
                      </h3>
                      <p className="text-xs text-gray-300 max-w-[200px]">
                        {t("dashboardV3.create.supportInfo")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: Controls */}
          <div className={cn(!isMobile && "col-span-7 lg:col-span-8 space-y-8")}>
            <div>
              {!isMobile && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">{t("dashboardV3.create.customizeTitle")}</h2>
                  <p className="text-gray-300 mt-1">
                    {t("dashboardV3.create.customizeSubtitle")}
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className={cn(
                "flex items-center gap-8 border-b border-gray-700 pb-1", 
                isMobile ? "justify-center mt-4" : "justify-start mb-8"
              )}>
                <button 
                  onClick={() => {
                    setTab("woman");
                    setCustomPrompt("");
                    setSelectedExampleImageId(46);
                  }}
                  className={cn(
                    "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
                    tab === "woman" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-300 hover:text-white"
                  )}
                >
                  <User className="h-4 w-4" />
                  {t("dashboardV3.create.tabs.female")}
                </button>
                <button 
                  onClick={() => {
                    setTab("man");
                    setCustomPrompt("");
                    setSelectedExampleImageId(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
                    tab === "man" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-300 hover:text-white"
                  )}
                >
                  <User className="h-4 w-4" />
                  {t("dashboardV3.create.tabs.male")}
                </button>
                <button 
                  onClick={() => setTab("custom")}
                  className={cn(
                    "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
                    tab === "custom" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-300 hover:text-white"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  {t("dashboardV3.create.tabs.custom")}
                </button>
              </div>

              {/* Content Area */}
              <div className={cn(isMobile ? "mt-4" : "")}>
                {tab === "custom" ? (
                  <div className="space-y-4">
                    <Textarea 
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={t("dashboardV3.create.customTab.placeholder")}
                      className={cn("resize-none text-base", isMobile ? "h-[150px]" : "min-h-[200px]")}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomPrompt(presets.professional.prompt)}
                        className={cn(
                          customPrompt === presets.professional.prompt && "bg-primary/10 border-primary text-white",
                          "border-gray-700 text-white hover:bg-gray-800"
                        )}
                      >
                        {presets.professional.label}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomPrompt(presets.business.prompt)}
                        className={cn(
                          customPrompt === presets.business.prompt && "bg-primary/10 border-primary text-white",
                          "border-gray-700 text-white hover:bg-gray-800"
                        )}
                      >
                        {presets.business.label}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomPrompt(presets.id_photo.prompt)}
                        className={cn(
                          customPrompt === presets.id_photo.prompt && "bg-primary/10 border-primary text-white",
                          "border-gray-700 text-white hover:bg-gray-800"
                        )}
                      >
                        {presets.id_photo.label}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={cn("grid gap-3", isMobile ? "grid-cols-3" : "grid-cols-3 lg:grid-cols-4 xl:grid-cols-4")}>
                    {styleCards.map((card) => {
                      const img = exampleImages.find((e) => e.id === card.exampleImageId);
                      if (!img) return null;
                      const isSelected = selectedExampleImageId === card.exampleImageId;
                      return (
                        <button
                          key={card.exampleImageId}
                          type="button"
                          onClick={() => setSelectedExampleImageId(card.exampleImageId)}
                          className={cn(
                            "rounded-2xl overflow-hidden border transition-all bg-gray-800/40 group",
                            isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-700 hover:border-primary/50"
                          )}
                          aria-label={card.label}
                        >
                          <div className="aspect-square w-full overflow-hidden">
                            <img
                              src={img.url}
                              alt={card.label}
                              className={cn(
                                "h-full w-full object-cover transition-transform duration-300", 
                                !isMobile && "group-hover:scale-105"
                              )}
                              loading="lazy"
                            />
                          </div>
                          <div className={cn("text-center font-medium text-white", isMobile ? "py-2 text-sm" : "py-3 text-sm")}>
                            {card.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Upload Section - appears above generate button */}
              {isMobile && (
                <div className="mt-6">
                  {/* Upload Section */}
                  <div 
                    className={cn(
                      "relative w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden cursor-pointer",
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                      "h-[16svh] min-h-[100px] max-h-[140px]"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />

                    {uploadedFile ? (
                      <div className="relative w-full h-full flex items-center justify-center p-2">
                        <img
                          src={uploadedFile.preview}
                          alt="Upload"
                          className="h-full max-h-full w-auto max-w-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-gray-800/90 border border-gray-700 shadow flex items-center justify-center hover:bg-gray-800 transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <div className={cn("rounded-full bg-primary/10 flex items-center justify-center mb-4", "w-10 h-10")}>
                          <Upload className={cn("text-primary", "h-5 w-5")} />
                        </div>
                        <h3 className={cn("font-semibold mb-1 text-white", "text-sm")}>
                          {t("dashboardV3.create.dragDrop")}
                        </h3>
                        <p className="text-xs text-gray-300 max-w-[200px]">
                          {t("dashboardV3.create.supportInfo")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                size="lg" 
                className={cn(
                  "w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold shadow-lg transition-all", 
                  isMobile ? "mt-6 h-12 text-base" : "mt-8 h-14 text-lg",
                  (!uploadedFile || (tab === "custom" && !customPrompt.trim()) || (tab !== "custom" && !selectedExampleImage)) && "opacity-50"
                )}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t("dashboardV3.create.generating")}
                  </>
                ) : (
                  t("dashboardV3.create.generate")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-white">{t("dashboardV3.pricing.title")}</DialogTitle>
          </DialogHeader>
          
          <p className="text-center text-gray-300 mb-4">
            {t("dashboardV3.pricing.subtitle")}
          </p>

          <div className="space-y-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                    isSelected ? "border-primary bg-primary/10" : "border-gray-700 hover:border-primary/50 bg-gray-800",
                    plan.popular && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("text-primary", isSelected && "scale-110")}>
                      {plan.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{plan.name}</span>
                        {plan.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {t("dashboardV3.pricing.popular")}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300">{plan.credits} {t("dashboardV3.pricing.photos")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{plan.price.formatted}</span>
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button 
            size="lg"
            className="w-full mt-4 rounded-full h-12 font-semibold"
            onClick={handlePurchase}
            disabled={isProcessingPayment || isLoadingPacks}
          >
            {isProcessingPayment ? t("dashboardV3.pricing.processing") : t("dashboardV3.pricing.buy", { plan: plans.find(p => p.id === selectedPlan)?.name, price: plans.find(p => p.id === selectedPlan)?.price.formatted })}
          </Button>

          {/* Money-Back Guarantee */}
          <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-gray-700">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-xs font-medium text-green-400">
              {t("buyCredits.moneyBackGuarantee")}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          // Clear pending action - the useEffect watching `user` will handle showing pricing modal
          setPendingAction(null);
          
          // Ensure we stay on create view
          setView("create");
          
          // The useEffect that watches `user` and `dashboardV3_pendingLogin` will:
          // 1. Restore form state
          // 2. Show pricing modal if user has no credits
        }}
        variant="page3"
      />
    </div>
  );
}
