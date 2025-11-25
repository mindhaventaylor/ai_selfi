import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  CreditCard,
  FlaskConical,
  Image as ImageIcon,
  Play,
  Check,
  AlertCircle,
} from "lucide-react";

export default function StartHere() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock photos for the grid background
  const gridPhotos = [
    "/image.jpg",
    "/image_1.jpg",
    "/image_10.jpg",
    "/image_100.jpg",
    "/image_101.jpg",
    "/image_102.jpg",
    "/image_103.jpg",
    "/image_104.jpg",
    "/image_105.jpg",
  ];

  const steps = [
    {
      id: 1,
      title: t("startHere.step1"),
      icon: CreditCard,
      color: "blue",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: 2,
      title: t("startHere.step2"),
      icon: FlaskConical,
      color: "yellow",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      id: 3,
      title: t("startHere.step3"),
      icon: Sparkles,
      color: "purple",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: 4,
      title: t("startHere.step4"),
      icon: ImageIcon,
      color: "green",
      buttonColor: "bg-green-500 hover:bg-green-600",
    },
  ];

  const scrollToStep = (stepId: number) => {
    const element = document.getElementById(`step-${stepId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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

              {/* Video Player Section */}
              <div className="mt-8">
                <div className="aspect-video bg-muted rounded-lg relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                  {!isPlaying ? (
                    <div className="relative z-10 text-center space-y-4 px-4">
                      <h3 className="text-2xl md:text-3xl font-bold">
                        {t("startHere.aiselfiIn60Seconds")}
                      </h3>
                      <p className="text-base md:text-lg text-muted-foreground">
                        {t("startHere.explainHowAppWorks")}
                      </p>
                      <button
                        onClick={() => setIsPlaying(true)}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform mx-auto"
                      >
                        <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                      <div className="text-center space-y-2 mb-4">
                        <p className="text-sm text-muted-foreground">
                          {t("startHere.videoPlaceholder")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("startHere.videoWillPlayHere")}
                        </p>
                      </div>
                      <div className="w-full px-4">
                        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-center">
                          {t("startHere.videoTimePlaying")}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Video Info */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm max-w-fit mx-auto">
                      {isPlaying ? t("startHere.videoTimePlaying") : t("startHere.videoTime")}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">{t("startHere.howItWorks")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("startHere.learnProcess")}
                  </p>
                </div>
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
                    className={`h-auto flex-col py-4 px-4 ${step.buttonColor} text-white border-0 hover:opacity-90`}
                    onClick={() => scrollToStep(step.id)}
                  >
                    <IconComponent className="w-6 h-6 mb-2" />
                    <span className="text-xs text-center leading-tight">
                      {step.title}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Buy Credits */}
        <Card id="step-1" className="bg-card/50 border-border mb-6">
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

        {/* Step 2: Train an AI Model */}
        <Card id="step-2" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("startHere.step2Title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("startHere.step2Subtitle")}
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.goodPhotosForTraining")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.goodPhoto1")}</li>
                    <li>{t("startHere.goodPhoto2")}</li>
                    <li>{t("startHere.goodPhoto3")}</li>
                    <li>{t("startHere.goodPhoto4")}</li>
                    <li>{t("startHere.goodPhoto5")}</li>
                    <li>{t("startHere.goodPhoto6")}</li>
                    <li>
                      {t("startHere.goodPhoto7")}
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{t("startHere.photosToAvoid")}</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.badPhoto1")}</li>
                    <li>{t("startHere.badPhoto2")}</li>
                    <li>{t("startHere.badPhoto3")}</li>
                    <li>{t("startHere.badPhoto4")}</li>
                    <li>{t("startHere.badPhoto5")}</li>
                    <li>{t("startHere.badPhoto6")}</li>
                    <li>{t("startHere.badPhoto7")}</li>
                    <li>{t("startHere.badPhoto8")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    {t("startHere.forBestResults")}
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>{t("startHere.bestResult1")}</li>
                    <li>{t("startHere.bestResult2")}</li>
                    <li>{t("startHere.bestResult3")}</li>
                    <li>{t("startHere.bestResult4")}</li>
                    <li>{t("startHere.bestResult5")}</li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${steps[1].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/models")}
                >
                  {t("startHere.trainYourAIModel")}
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 3: Creating Your Photos */}
        <Card id="step-3" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("startHere.step3Title")}
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
                  className={`mt-6 ${steps[2].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/generate")}
                >
                  {t("startHere.createYourPhotosWithAI")}
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 4: Gallery */}
        <Card id="step-4" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("startHere.step4Title")}
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
                  className={`mt-6 ${steps[3].buttonColor} text-white rounded-full`}
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

