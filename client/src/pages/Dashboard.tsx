import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeLocalStorage } from "@/utils/localStorage";
import DashboardV2 from "./DashboardV2";
import DashboardV3 from "./DashboardV3";
import {
  Sparkles,
  CreditCard,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

export default function Dashboard() {
  // All hooks must be called at the top, before any conditional returns
  const { user } = useAuth();
  const { variant: posthogVariant, isLoading } = usePostHogVariant(user?.id);
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Check for URL parameter to force variant (for testing)
  // Use useMemo to avoid reading from localStorage on every render
  const forcedVariantRaw = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  }, []);
  // Normalize page1 to page2 - page1 should never be used
  const forcedVariant = forcedVariantRaw === "page1" ? "page2" : forcedVariantRaw;
  
  // Also check localStorage directly - use state initialized once to avoid re-reading on every render
  const [cachedVariantRaw] = useState<"page1" | "page2" | "page3" | "page4" | "page5" | null>(() => {
    return safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  });
  // Normalize page1 to page2
  const cachedVariant = cachedVariantRaw === "page1" ? "page2" : cachedVariantRaw;
  
  // Use forced variant from URL if present, then cached, then PostHog variant
  const variant = forcedVariant || cachedVariant || posthogVariant;
  
  // Update URL if it was page1
  useEffect(() => {
    if (forcedVariantRaw === "page1" && forcedVariant === "page2") {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("variant", "page2");
      const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [forcedVariantRaw, forcedVariant]);
  
  // Save variant to cache if detected from URL (normalized)
  // Use useRef to track if we've already saved to avoid infinite loops
  const savedVariantRef = useRef<string | null>(null);
  useEffect(() => {
    if (forcedVariant && forcedVariant !== savedVariantRef.current) {
      safeLocalStorage.setItem("aiselfi_dashboard_variant", forcedVariant);
      savedVariantRef.current = forcedVariant;
    }
  }, [forcedVariant]);

  // Show loading state while determining variant (only if not forcing via URL)
  if (isLoading && !forcedVariant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  // Show DashboardV2 for all variants (page2, page3, page4, page5) - all use the same design and flow
  // Note: DashboardLayout is already provided by App.tsx, so we don't wrap again
  if (variant === "page2" || variant === "page3" || variant === "page4" || variant === "page5") {
    return <DashboardV2 />;
  }
  

  // Check for page2 variant for content filtering (page2, page3, page4, page5 all use page2 design)
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  const cachedVariantForContent = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  const isPage2Variant = urlVariant === "page2" || urlVariant === "page3" || urlVariant === "page4" || urlVariant === "page5" 
    || cachedVariantForContent === "page2" || cachedVariantForContent === "page3" || cachedVariantForContent === "page4" || cachedVariantForContent === "page5"
    || firstVariant === "page2" || firstVariant === "page3" || firstVariant === "page4" || firstVariant === "page5";

  // Mock photos for the grid background
  const gridPhotos = [
    "/image.webp",
    "/image_1.webp",
    "/image_10.webp",
    "/image_100.webp",
    "/image_101.webp",
    "/over100_1.webp",
    "/over100_2.webp",
    "/over100_3.webp",
    "/over100_4.webp",
  ];

  // Define all steps (Step 2 removed for both variants)
  const allSteps = [
    {
      id: 1,
      title: t("startHere.step1"),
      icon: CreditCard,
      color: "blue",
      buttonColor: "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl",
    },
    {
      id: 3,
      title: t("startHere.step3"), // Step 3 becomes step 2
      icon: Sparkles,
      color: "purple",
      buttonColor: "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl",
    },
    {
      id: 4,
      title: t("startHere.step4"), // Step 4 becomes step 3
      icon: ImageIcon,
      color: "green",
      buttonColor: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl",
    },
  ];
  
  // For page2 variant, renumber the steps
  const steps = isPage2Variant
    ? allSteps.map((step, index) => ({
        ...step,
        id: index + 1, // Renumber: 1, 2, 3 (was 1, 3, 4)
      }))
    : allSteps;

  // Helper function to get step title with correct number (Step 2 removed for both variants)
  const getStepTitle = (stepKey: "step3Title" | "step4Title"): string => {
    const fullTitle = t(stepKey);
    
    // Extract the step number and text from the title
    // Pattern: "Step 3: Creating Your Photos" or "Step 4: Gallery - Your Photos"
    const step3Match = fullTitle.match(/^(Step|Passo|Paso)\s+3\s*:\s*(.+)$/i);
    const step4Match = fullTitle.match(/^(Step|Passo|Paso)\s+4\s*:\s*(.+)$/i);
    
    if (stepKey === "step3Title" && step3Match) {
      const [, prefix, text] = step3Match;
      const stepNumber = isPage2Variant ? 2 : 3;
      return `${prefix} ${stepNumber}: ${text}`;
    } else if (stepKey === "step4Title" && step4Match) {
      const [, prefix, text] = step4Match;
      const stepNumber = isPage2Variant ? 3 : 4;
      return `${prefix} ${stepNumber}: ${text}`;
    }
    
    // Fallback: try simple replacement if regex doesn't match
    if (isPage2Variant) {
      if (stepKey === "step3Title") {
        return fullTitle.replace(/^(Step|Passo|Paso)\s+3\s*:/i, "$1 2:");
      } else if (stepKey === "step4Title") {
        return fullTitle.replace(/^(Step|Passo|Paso)\s+4\s*:/i, "$1 3:");
      }
    }
    
    return fullTitle;
  };

  const scrollToStep = (stepId: number) => {
    // For page2 variant, the HTML element IDs are already adjusted:
    // - step-1 stays step-1
    // - step-3 becomes step-2 (because id={isPage2Variant ? "step-2" : "step-3"})
    // - step-4 becomes step-3 (because id={isPage2Variant ? "step-3" : "step-4"})
    // For normal variant, use step IDs as-is: 1->1, 3->3, 4->4
    let actualStepId = stepId;
    if (isPage2Variant) {
      // In page2, the displayed step IDs (1, 2, 3) map directly to HTML element IDs
      // because the elements already have adjusted IDs
      // stepId 1 -> step-1, stepId 2 -> step-2, stepId 3 -> step-3
      actualStepId = stepId;
    } else {
      // In normal variant, step IDs map directly: 1->1, 3->3, 4->4
      actualStepId = stepId;
    }
    const element = document.getElementById(`step-${actualStepId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn(`[Dashboard] Element with id "step-${actualStepId}" not found. isPage2Variant: ${isPage2Variant}, stepId: ${stepId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {t("startHere.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("startHere.subtitle")}
          </p>
        </div>

        {/* Hero Section - Video Card */}
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 mb-8">
          <CardContent className="p-8 md:p-12 relative z-10">
            {/* Background Grid of Photos */}
            <div className="absolute inset-0 opacity-10 z-0">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-4 h-full">
                {gridPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt={t("startHere.photoAlt", { number: idx + 1 })}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              {/* Title Section */}
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold">{t("startHere.aiselfies")}</h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                  {t("startHere.convertSelfiesToProfessional")}
                </p>
                <Button
                  size="lg"
                  className="text-base md:text-lg px-8 md:px-10 py-6 md:py-7 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow"
                  onClick={() => setLocation("/dashboard/generate")}
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  {t("startHere.generateImages")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido Section */}
        <Card className="bg-card/50 border-border mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">{t("startHere.content")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <Button
                    key={step.id}
                    variant="outline"
                    className={`h-auto flex-col py-4 px-3 ${step.buttonColor} text-white border-0 hover:scale-105 transition-all duration-200 w-full`}
                    onClick={() => scrollToStep(step.id)}
                  >
                    <IconComponent className="w-6 h-6 mb-2 drop-shadow-sm flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs text-center leading-tight font-semibold drop-shadow-sm break-words whitespace-normal px-1 w-full">
                      {step.title}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Buy Credits */}
        <Card id="step-1" className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-600/10 border-blue-500/20 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("startHere.step1Title")}
                </h2>
              </div>
            </div>

              <div className="space-y-4 text-sm">
                <p>
                  {t("startHere.step1Desc")}
                </p>
                <p>
                  {t("startHere.step1Desc2")}
                </p>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">
                    {t("startHere.step1Includes")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      {t("startHere.step1Includes1")}
                    </li>
                    <li>
                      {t("startHere.step1Includes2")}
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">{t("startHere.step1Notes")}</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      {t("startHere.step1Notes1")}
                    </li>
                    <li>{t("startHere.step1Notes2")}</li>
                    <li>
                      {t("startHere.step1Notes3")}
                    </li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${steps[0].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/credits/buy")}
                >
                  {t("startHere.buyCredits")}
                </Button>
              </div>
            </CardContent>
          </Card>


        {/* Step 3: Creating Your Photos (becomes Step 2 for page2) */}
        <Card id={isPage2Variant ? "step-2" : "step-3"} className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-purple-600/10 border-purple-500/20 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {getStepTitle("step3Title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("startHere.step3Subtitle")}
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <p>
                  {t("startHere.step3Desc")}
                </p>

                <div>
                  <h3 className="font-semibold mb-3">{t("startHere.howToCreatePhotos")}</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.createPhoto1")}</li>
                    <li>{t("startHere.createPhoto2")}</li>
                    <li>
                      {t("startHere.createPhoto3")}
                    </li>
                    <li>
                      {t("startHere.createPhoto4")}
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.chooseParameters")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.param1")}</li>
                    <li>{t("startHere.param2")}</li>
                    <li>{t("startHere.param3")}</li>
                    <li>{t("startHere.param4")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.tipsForBestResults")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      {t("startHere.tip1")}
                    </li>
                    <li>
                      {t("startHere.tip2")}
                    </li>
                    <li>{t("startHere.tip3")}</li>
                    <li>{t("startHere.tip4")}</li>
                    <li>{t("startHere.tip5")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{t("startHere.importantNotes")}</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      {t("startHere.note1")}
                    </li>
                    <li>
                      {t("startHere.note2")}
                    </li>
                    <li>
                      {t("startHere.note3")}
                    </li>
                    <li>
                      {t("startHere.note4")}
                    </li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${isPage2Variant ? steps[1].buttonColor : steps[1].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/generate")}
                >
                  {t("startHere.createYourPhotosWithAI")}
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 4: Gallery (becomes Step 3 after removing model step) */}
        <Card id="step-4" className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-green-600/10 border-green-500/20 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {getStepTitle("step4Title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("startHere.step4Subtitle")}
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.whatYouCanDo")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.galleryFeature1")}</li>
                    <li>{t("startHere.galleryFeature2")}</li>
                    <li>{t("startHere.galleryFeature3")}</li>
                    <li>{t("startHere.galleryFeature4")}</li>
                    <li>{t("startHere.galleryFeature5")}</li>
                    <li>{t("startHere.galleryFeature6")}</li>
                    <li>{t("startHere.galleryFeature7")}</li>
                    <li>{t("startHere.galleryFeature8")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.tipsToOrganize")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.organizeTip1")}</li>
                    <li>{t("startHere.organizeTip2")}</li>
                    <li>{t("startHere.organizeTip3")}</li>
                    <li>
                      {t("startHere.organizeTip4")}
                    </li>
                  </ul>
                </div>

                <Alert className="bg-yellow-500/20 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-sm">
                    <strong>{t("startHere.importantInfo")}</strong> {t("startHere.importantInfoText")}
                  </AlertDescription>
                </Alert>

                <Button
                  className={`mt-6 ${steps[2].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/gallery")}
                >
                  {t("startHere.viewYourGallery")}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
