import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
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
  "/image_selection/Man/8_man_studio_casual.webp",
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
  const [currency, setCurrency] = useState<Currency>(detectCurrency());

  // Mutations
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();
  const generateMutation = trpc.photo.generate.useMutation();
  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  
  // Queries
  const { data: packsData, isLoading: isLoadingPacks } = trpc.payment.getPacks.useQuery();
  const packs = packsData?.packs;

  // Update currency when language changes
  useEffect(() => {
    setCurrency(detectCurrency());
  }, [currentLanguage]);

  // Pricing
  const basicPrice = getPage2Price("basic", currency);
  const standardPrice = getPage2Price("standard", currency);
  const premiumPrice = getPage2Price("premium", currency);

  const plans = [
    {
      id: "basic" as const,
      name: "Basic",
      price: basicPrice,
      credits: PAGE2_CREDITS.basic,
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: "standard" as const,
      name: "Standard",
      price: standardPrice,
      credits: PAGE2_CREDITS.standard,
      icon: <Star className="h-5 w-5" />,
      popular: true,
    },
    {
      id: "premium" as const,
      name: "Premium",
      price: premiumPrice,
      credits: PAGE2_CREDITS.premium,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  // Custom presets
  const presets: Record<CustomPreset, { label: string; prompt: string }> = {
    professional: {
      label: "Professional",
      prompt: "A formal professional headshot with a suit, neutral background, and a confident expression."
    },
    business: {
      label: "Business",
      prompt: "A modern business headshot with a friendly yet authoritative expression, wearing smart office attire (e.g., blazer without tie or elegant blouse), captured in a bright indoor setting such as an office or co-working space."
    },
    id_photo: {
      label: "ID Photo",
      prompt: "Standard ID photo, head-on, neutral expression, no smiling, plain white background, well-lit, no shadows, face fully visible, clear and sharp image, no accessories (e.g., glasses, hats)."
    }
  };

  const styleCards = useMemo(() => {
    const manCards: V3StyleCard[] = [
      { label: "Academic", exampleImageId: 1 },
      { label: "Business", exampleImageId: 4 },
      { label: "Casual", exampleImageId: 5 },
      { label: "Energetic", exampleImageId: 20 },
      { label: "ID Photo", exampleImageId: 23 },
      { label: "Modern", exampleImageId: 17 },
      { label: "Professional", exampleImageId: 7 },
      { label: "Sepia", exampleImageId: 10 },
      { label: "Sophisticated", exampleImageId: 13 },
    ];

    const womanCards: V3StyleCard[] = [
      { label: "Academic", exampleImageId: 62 },
      { label: "Business", exampleImageId: 56 },
      { label: "Casual", exampleImageId: 64 },
      { label: "Energetic", exampleImageId: 55 },
      { label: "ID Photo", exampleImageId: 51 },
      { label: "Modern", exampleImageId: 54 },
      { label: "Professional", exampleImageId: 52 },
      { label: "Sepia", exampleImageId: 61 },
      { label: "Sophisticated", exampleImageId: 60 },
    ];

    return tab === "man" ? manCards : womanCards;
  }, [tab]);

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

  // Handle purchase
  const handlePurchase = async () => {
    if (isProcessingPayment || isLoadingPacks) return;
    
    const packId = getPackIdByPlan(selectedPlan);
    if (!packId) {
      toast.error("Pack not found");
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
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
        toast.error("Failed to create checkout session");
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to start checkout");
      setIsProcessingPayment(false);
    }
  };

  // Generate handler
  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an image first");
      return;
    }

    if (!user) {
      toast.error("Please login to continue");
      return;
    }

    if (tab === "custom" && !customPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (tab !== "custom" && !selectedExampleImage) {
      toast.error("Please choose a style");
      return;
    }

    // Check credits - if insufficient, show pricing modal
    const creditsNeeded = 4; // 4 images generated
    if ((user.credits || 0) < creditsNeeded) {
      setShowPricingModal(true);
      return;
    }

    // Proceed with generation
    await startGeneration();
  };

  const startGeneration = async () => {
    if (!uploadedFile || !user) return;

    try {
      const loadingToast = toast.loading("Preparing generation...");

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
        toast.success("Generation started!");
        // Navigate to generate page with batchId - this will show the generation modal
        // When closed, it will redirect to gallery
        setLocation(`/dashboard/generate?variant=page3&batchId=${result.batchId}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Generation failed");
    }
  };

  // ============ HERO VIEW ============
  if (view === "hero") {
    return (
      <div className="bg-background min-h-[calc(100vh-56px)]">
        <div className={cn("mx-auto w-full max-w-lg px-6 flex flex-col items-center", isMobile ? "pt-8 pb-32" : "py-16")}>
          {/* Hero Card */}
          <div className="w-full rounded-3xl border border-border bg-card/50 p-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Create professional AI portraits
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Transform your existing photos into realistic AI portrait photos for your resume, LinkedIn, and social media profiles.
            </p>
            
            {/* Example Images */}
            <div className="flex justify-center gap-3 mb-10">
              {heroExampleImages.map((src, idx) => (
                <div 
                  key={idx} 
                  className="w-28 h-36 md:w-32 md:h-44 rounded-2xl overflow-hidden border border-border shadow-lg"
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
              Create headshots
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Bottom Navigation (Mobile) */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-end justify-around relative">
                <button
                  onClick={() => setLocation("/dashboard/start")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                  aria-label="Start Here"
                >
                  <HelpCircle className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Start</span>
                </button>

                <button
                  onClick={() => setLocation("/dashboard/gallery")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                  aria-label="Gallery"
                >
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Gallery</span>
                </button>

                <button
                  onClick={() => setView("create")}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                  aria-label="Create"
                >
                  <Plus className="h-7 w-7" />
                </button>

                <button
                  onClick={() => setLocation("/dashboard/credits/buy")}
                  className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                  aria-label="Buy Credits"
                >
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Credits</span>
                </button>

                <button
                  onClick={() => setLocation("/dashboard/settings/general")}
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
      </div>
    );
  }

  // ============ CREATE VIEW (no header/navbar) ============
  return (
    <div className="bg-background min-h-screen">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => setView("hero")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className={cn("mx-auto w-full max-w-md px-4", isMobile ? "pt-4 pb-8" : "py-6 space-y-6")}>
        {/* Upload Section */}
        <div 
          className={cn(
            "relative w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            isMobile ? "h-[16svh] min-h-[100px] max-h-[140px]" : "h-32"
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
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border border-border shadow flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-0.5">Drag or upload image</h3>
              <p className="text-xs text-muted-foreground">Support jpg/jpeg/png/webp, up to 16MB</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={cn("flex items-center justify-center gap-8 border-b border-border pb-1", isMobile ? "mt-4" : "mt-6")}>
          <button 
            onClick={() => {
              setTab("woman");
              setCustomPrompt("");
              setSelectedExampleImageId(46);
            }}
            className={cn(
              "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
              tab === "woman" ? "text-primary border-b-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Female
          </button>
          <button 
            onClick={() => {
              setTab("man");
              setCustomPrompt("");
              setSelectedExampleImageId(1);
            }}
            className={cn(
              "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
              tab === "man" ? "text-primary border-b-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Male
          </button>
          <button 
            onClick={() => setTab("custom")}
            className={cn(
              "flex items-center gap-2 pb-2 -mb-2.5 transition-colors",
              tab === "custom" ? "text-primary border-b-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Custom
          </button>
        </div>

        {/* Content Area */}
        <div className={cn(isMobile ? "mt-4" : "space-y-4 mt-4")}>
          {tab === "custom" ? (
            <div className="space-y-4">
              <Textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className={cn("resize-none text-base", isMobile ? "h-[150px]" : "min-h-[187px]")}
              />
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomPrompt(presets.professional.prompt)}
                  className={cn(customPrompt === presets.professional.prompt && "bg-primary/10 border-primary")}
                >
                  Professional
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomPrompt(presets.business.prompt)}
                  className={cn(customPrompt === presets.business.prompt && "bg-primary/10 border-primary")}
                >
                  Business
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomPrompt(presets.id_photo.prompt)}
                  className={cn(customPrompt === presets.id_photo.prompt && "bg-primary/10 border-primary")}
                >
                  ID Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn("grid grid-cols-3 gap-3")}>
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
                      "rounded-2xl overflow-hidden border transition-all bg-card/40",
                      isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    )}
                    aria-label={card.label}
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={img.url}
                        alt={card.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className={cn("text-center font-medium text-foreground/90", isMobile ? "py-2 text-sm" : "py-3 text-sm")}>
                      {card.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button 
          size="lg" 
          className={cn("w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-base font-semibold shadow-lg", isMobile ? "mt-6" : "mt-6")}
          onClick={handleGenerate}
          disabled={!uploadedFile || (tab === "custom" && !customPrompt.trim()) || (tab !== "custom" && !selectedExampleImage)}
        >
          Generate
        </Button>
      </div>

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Get Credits</DialogTitle>
          </DialogHeader>
          
          <p className="text-center text-muted-foreground mb-4">
            You need credits to generate images. Choose a plan below.
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
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    plan.popular && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("text-primary", isSelected && "scale-110")}>
                      {plan.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{plan.credits} photos</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{plan.price.formatted}</span>
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
            {isProcessingPayment ? "Processing..." : `Buy ${plans.find(p => p.id === selectedPlan)?.name} - ${plans.find(p => p.id === selectedPlan)?.price.formatted}`}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
