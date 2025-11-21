import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Sparkles, 
  CreditCard, 
  Settings, 
  ChevronDown,
  User,
  Image as ImageIcon,
  Glasses,
  Palette,
  Scissors,
  Download,
  AlertCircle
} from "lucide-react";
import { exampleImages, filterExampleImages, type ExampleImage } from "@/data/exampleImages";

export default function GenerateImages() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [gender, setGender] = useState<"man" | "woman">("man");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("9:16");
  const [modelId, setModelId] = useState<string>("");
  const [glasses, setGlasses] = useState<string>("no");
  const [hairColor, setHairColor] = useState<string>("default");
  const [hairStyle, setHairStyle] = useState<string>("no-preference");
  
  // Generation modal state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: number; url: string; status: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's models
  const { data: modelsData, isLoading: isLoadingModels } = trpc.model.list.useQuery();
  const generateMutation = trpc.photo.generate.useMutation();
  const getBatchStatusQuery = trpc.photo.getBatchStatus.useQuery(
    { batchId: currentBatchId! },
    { 
      enabled: !!currentBatchId && isGenerating,
      refetchInterval: isGenerating ? 2000 : false, // Poll every 2 seconds while generating
    }
  );
  
  // Fetch training images for selected model
  const { data: trainingImages } = trpc.model.getTrainingImages.useQuery(
    { modelId: parseInt(modelId) },
    { enabled: !!modelId && modelId !== "" }
  );

  const backgrounds = ["office", "neutral", "studio"];
  const styles = ["formal", "casual", "elegant", "professional"];

  const badges = t("generateImages.badges", { returnObjects: true }) as { premium: string; new: string; popular: string };
  
  // Filter example images based on gender and selected styles/backgrounds
  const filteredExampleImages = filterExampleImages(
    exampleImages,
    gender,
    selectedStyles,
    selectedBackgrounds
  );

  const toggleImage = (id: number) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleBackground = (bg: string) => {
    setSelectedBackgrounds((prev) =>
      prev.includes(bg) ? prev.filter((b) => b !== bg) : [...prev, bg]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  // Calculate credits needed based on selected example images (4 variations per selected image)
  const imageCount = selectedImages.length;
  const totalImagesToGenerate = imageCount * 4; // 4 images per selected image

  // Update progress from polling
  useEffect(() => {
    if (getBatchStatusQuery.data && currentBatchId) {
      const { batch, photos } = getBatchStatusQuery.data;
      
      // Update progress
      if (batch.status === "completed") {
        setIsGenerating(false);
        setGenerationProgress(100);
        setCompletedImages(batch.totalImagesGenerated);
        setGeneratedImages(photos.map(p => ({ id: p.id, url: p.url, status: p.status })));
      } else if (batch.status === "failed") {
        setIsGenerating(false);
        setErrorMessage("Image generation failed. Please try again.");
      } else if (batch.status === "generating") {
        // Update progress based on generated images
        setCompletedImages(batch.totalImagesGenerated);
        // Use batch.totalImagesGenerated or fallback to calculated total
        const expectedTotal = batch.totalImagesGenerated > 0 
          ? Math.max(batch.totalImagesGenerated, totalImagesToGenerate)
          : totalImagesToGenerate;
        setGenerationProgress(Math.min(95, (batch.totalImagesGenerated / expectedTotal) * 100));
        
        // Update generated images list
        const newImages = photos.map(p => ({ id: p.id, url: p.url, status: p.status }));
        setGeneratedImages(newImages);
      }
    }
  }, [getBatchStatusQuery.data, currentBatchId, totalImagesToGenerate]);
  const creditsNeeded = totalImagesToGenerate; // 1 credit per generated image
  const userCredits = user?.credits ?? 0;
  const hasEnoughCredits = creditsNeeded <= userCredits;
  const selectedModelStatus = modelsData?.find((m) => m.id.toString() === modelId)?.status;
  const isModelReady = selectedModelStatus === "ready";
  const canGenerate = imageCount > 0 && hasEnoughCredits && modelId !== "" && isModelReady;

  const handleGenerate = async () => {
    if (!canGenerate || !modelId) return;
    
    // Get selected model
    const selectedModel = modelsData?.find((m) => m.id.toString() === modelId);
    if (!selectedModel) {
      alert(t("generateImages.pleaseSelectValidModel"));
      return;
    }

    // Build reference image URLs:
    // 1. First, add the model's training images (limited to 1 to minimize token usage and avoid rate limits)
    // 2. Then, add the selected example images for style reference
    const referenceImageUrls: string[] = [];
    
    // Add model's training images (max 1 to minimize payload size and token consumption)
    // Using only 1 training image significantly reduces the payload size and helps avoid rate limits
    if (trainingImages && trainingImages.length > 0) {
      referenceImageUrls.push(trainingImages[0]); // Use only the first training image
    } else if (selectedModel.previewImageUrl) {
      // Fallback to preview image if training images aren't loaded yet
      referenceImageUrls.push(selectedModel.previewImageUrl);
    }
    
    if (referenceImageUrls.length === 0) {
      alert(t("generateImages.noTrainingImagesFound"));
      return;
    }
    
    // Get selected example images with their prompts
    const selectedExampleImages = filteredExampleImages.filter((img) => 
      selectedImages.includes(img.id)
    );
    
    if (selectedExampleImages.length === 0) {
      alert(t("generateImages.noImagesSelected"));
      return;
    }
    
    // Build base prompt from user options
    let basePrompt = `Create a photorealistic professional portrait image of the person in the reference photos.`;
    if (selectedBackgrounds.length > 0) {
      basePrompt += ` Use a ${selectedBackgrounds.join(", ")} background.`;
    }
    if (selectedStyles.length > 0) {
      basePrompt += ` Style: ${selectedStyles.join(", ")}.`;
    }
    if (glasses === "yes") {
      basePrompt += ` Include glasses.`;
    }
    if (hairColor && hairColor !== "default") {
      basePrompt += ` Hair color: ${hairColor}.`;
    }
    if (hairStyle && hairStyle !== "no-preference") {
      basePrompt += ` Hair style: ${hairStyle}.`;
    }
    basePrompt += ` High quality, professional photography, natural lighting, sharp focus.`;
    
    // Reset state
    setIsGenerating(true);
    setGenerationProgress(0);
    setCompletedImages(0);
    setGeneratedImages([]);
    setErrorMessage(null);
    setCurrentBatchId(null);
    setShowModal(true);
    
    try {
      // Call the API with new structure
      const result = await generateMutation.mutateAsync({
        modelId: parseInt(modelId),
        trainingImageUrls: referenceImageUrls,
        exampleImages: selectedExampleImages.map(img => {
          // Convert relative URLs to absolute URLs
          let absoluteUrl = img.url;
          
          if (!img.url.startsWith('http')) {
            // If it's a relative URL, convert to absolute
            if (img.url.startsWith('/')) {
              // Use production domain if available, otherwise use current origin
              // In production, this should be your actual domain
              const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
              absoluteUrl = `${publicDomain}${img.url}`;
            } else {
              // If it doesn't start with /, assume it's relative to root
              const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
              absoluteUrl = `${publicDomain}/${img.url}`;
            }
          }
          
          return {
            id: img.id,
            url: absoluteUrl,
            prompt: img.prompt,
          };
        }),
        basePrompt,
        aspectRatio,
        numImagesPerExample: 4,
        glasses: glasses as "yes" | "no",
        hairColor: hairColor !== "default" ? hairColor : undefined,
        hairStyle: hairStyle !== "no-preference" ? hairStyle : undefined,
        backgrounds: selectedBackgrounds,
        styles: selectedStyles,
      });

      // Set batch ID for polling
      if (result.batchId) {
        setCurrentBatchId(result.batchId);
      } else {
        // Fallback if no batch ID (shouldn't happen)
        setIsGenerating(false);
        setErrorMessage("Failed to start generation. Please try again.");
      }
    } catch (error: any) {
      console.error("Error generating images:", error);
      setIsGenerating(false);
      
      // Show error in modal instead of alert
      const errorMsg = error?.message || t("generateImages.errorGenerating");
      setErrorMessage(errorMsg);
    }
  };

  const handleDownloadImage = (image: { id: number; url: string; status: string } | string, index: number) => {
    const imageUrl = typeof image === 'string' ? image : image.url;
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold">{t("generateImages.title")}</h1>

            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("generateImages.selectGender")}</label>
              <div className="flex gap-3">
                <Button
                  variant={gender === "man" ? "default" : "outline"}
                  onClick={() => setGender("man")}
                  className={gender === "man" ? "bg-primary" : ""}
                >
                  {t("generateImages.man")}
                </Button>
                <Button
                  variant={gender === "woman" ? "default" : "outline"}
                  onClick={() => setGender("woman")}
                  className={gender === "woman" ? "bg-primary" : ""}
                >
                  {t("generateImages.woman")}
                </Button>
              </div>
            </div>

            {/* Filter Images */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("generateImages.background")}</label>
                <div className="flex flex-wrap gap-2">
                  {backgrounds.map((bg) => (
                    <Button
                      key={bg}
                      variant={selectedBackgrounds.includes(bg) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBackground(bg)}
                      className={
                        selectedBackgrounds.includes(bg) ? "bg-primary" : ""
                      }
                    >
                      {bg}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("generateImages.style")}</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <Button
                      key={style}
                      variant={selectedStyles.includes(style) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStyle(style)}
                      className={
                        selectedStyles.includes(style) ? "bg-primary" : ""
                      }
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Multiple Variations Banner */}
            <Card className="bg-primary/20 border-primary/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t("generateImages.multipleVariations")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("generateImages.multipleVariationsDesc")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Images Grid - User selects style images */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t("generateImages.modelTrainingImages")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("generateImages.selectReferenceImages")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredExampleImages.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {t("generateImages.noImagesMatchFilters")}
                  </div>
                ) : (
                  filteredExampleImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImages.includes(image.id)
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleImage(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={`${t("generateImages.altText.reference")} ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                    {image.badge && (
                      <Badge
                        className={`absolute top-2 right-2 ${
                          image.badge === badges.premium
                            ? "bg-purple-500"
                            : image.badge === badges.new
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {image.badge}
                      </Badge>
                    )}
                    {selectedImages.includes(image.id) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Parameters Sidebar - Fixed to the right */}
          <div className="w-full lg:w-[380px] shrink-0 flex-shrink-0">
            <Card className="bg-card/50 border-border lg:sticky lg:top-20 w-full">
              <CardContent className="p-0">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors border-b border-border">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-purple-400" />
                      <h2 className="text-xl font-bold">{t("generateImages.parameters")}</h2>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-6 space-y-6">
                      {/* Model ID */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.model")}</label>
                        </div>
                        <Select value={modelId} onValueChange={setModelId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("generateImages.selectModel")} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingModels ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t("generateImages.loadingModels")}
                              </div>
                            ) : modelsData && modelsData.length > 0 ? (
                              modelsData.map((model) => (
                                <SelectItem 
                                  key={model.id} 
                                  value={model.id.toString()}
                                  disabled={model.status !== "ready"}
                                >
                                  {model.name} {model.gender ? `(${model.gender})` : ""} 
                                  {model.status === "training" && ` - ${t("generateImages.training")}`}
                                  {model.status === "failed" && ` - ${t("generateImages.failed")}`}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t("generateImages.noModelsAvailable")}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {!modelId && modelsData && modelsData.length === 0 && t("generateImages.firstNeedToTrain")}
                          {!modelId && modelsData && modelsData.length > 0 && t("generateImages.selectModelToGenerate")}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "training" && t("generateImages.modelStillTraining")}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "failed" && t("generateImages.modelFailed")}
                        </p>
                      </div>

                      {/* Image Dimensions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.imageDimensions")}</label>
                        </div>
                        <div className="flex gap-2">
                          {(["1:1", "9:16", "16:9"] as const).map((ratio) => (
                            <Button
                              key={ratio}
                              variant={aspectRatio === ratio ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio(ratio)}
                              className={
                                aspectRatio === ratio
                                  ? "bg-purple-500 hover:bg-purple-600 border-purple-500"
                                  : "flex-1"
                              }
                            >
                              {ratio}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.aspectRatio")}
                        </p>
                      </div>

                      {/* Glasses */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Glasses className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.doYouWearGlasses")}</label>
                        </div>
                        <Select value={glasses} onValueChange={setGlasses}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">{t("generateImages.no")}</SelectItem>
                            <SelectItem value="yes">{t("generateImages.yes")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.addGlassesToImages")}
                        </p>
                      </div>

                      {/* Hair Color */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            {t("generateImages.hairColor")}
                          </label>
                        </div>
                        <Select value={hairColor} onValueChange={setHairColor}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">{t("generateImages.default")}</SelectItem>
                            <SelectItem value="black">{t("generateImages.black")}</SelectItem>
                            <SelectItem value="brown">{t("generateImages.brown")}</SelectItem>
                            <SelectItem value="blonde">{t("generateImages.blonde")}</SelectItem>
                            <SelectItem value="red">{t("generateImages.red")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.chooseHairColor")}
                        </p>
                      </div>

                      {/* Hair Style */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            {t("generateImages.hairStyle")}
                          </label>
                        </div>
                        <Select value={hairStyle} onValueChange={setHairStyle}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-preference">{t("generateImages.noPreference")}</SelectItem>
                            <SelectItem value="short">{t("generateImages.short")}</SelectItem>
                            <SelectItem value="medium">{t("generateImages.medium")}</SelectItem>
                            <SelectItem value="long">{t("generateImages.long")}</SelectItem>
                            <SelectItem value="curly">{t("generateImages.curly")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.selectHairStyle")}
                        </p>
                      </div>

                      {/* Generate Button */}
                      <div className="pt-4 border-t border-border">
                        <Button
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                          disabled={!canGenerate}
                          onClick={handleGenerate}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t("generateImages.generate")} {totalImagesToGenerate} {t("generateImages.images")}
                        </Button>
                        
                        {/* Credits Usage */}
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {imageCount === 0 
                              ? t("generateImages.selectImagesToGenerate")
                              : !hasEnoughCredits
                              ? `${t("generateImages.notEnoughCredits")} (${t("generateImages.needCredits")} ${creditsNeeded}, ${t("generateImages.haveCredits")} ${userCredits})`
                              : modelId === ""
                              ? t("generateImages.selectModelFirst")
                              : `${t("generateImages.willUseCredits")} ${creditsNeeded} ${creditsNeeded === 1 ? t("generateImages.credit") : t("generateImages.credits")}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Generation Progress Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">
                {t("generateImages.professionalPhotosAlmostReady")}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4 flex-shrink-0">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-destructive">
                      {t("generateImages.errorGeneratingImages")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {errorMessage}
                    </p>
                    {errorMessage.includes('rate limit') && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setErrorMessage(null);
                            setGenerationProgress(0);
                            setCompletedImages(0);
                            setGeneratedImages([]);
                            handleGenerate();
                          }}
                        >
                          {t("generateImages.retry")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowModal(false)}
                        >
                          {t("generateImages.close")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Only show if not error */}
            {!errorMessage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("generateImages.progress")}</span>
                  <span className={`text-sm font-bold ${generationProgress === 100 ? 'text-green-500' : 'text-primary'}`}>
                    {generationProgress}%
                  </span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedImages} {t("generateImages.of")} {totalImagesToGenerate} {t("generateImages.imagesCompleted")}
                </p>
              </div>
            )}

            {/* Info Message - Only show if not error and generating */}
            {!errorMessage && isGenerating && (
              <p className="text-sm text-muted-foreground">
                {t("generateImages.generatingProfessionalPhotos")}
              </p>
            )}

            {/* Success Message */}
            {!errorMessage && !isGenerating && generatedImages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("generateImages.canCloseWindow")}
              </p>
            )}
          </div>

          {/* Images Grid - Scrollable */}
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Show generated images */}
              {generatedImages.map((image, index) => (
                <div
                  key={`generated-${image.id || index}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all cursor-pointer"
                  onClick={() => handleDownloadImage(image, index)}
                >
                  <img
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/400/400?random=${index}`;
                    }}
                  />
                  {/* Download Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-background/90 rounded-full p-3">
                      <Download className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  {/* Download Badge */}
                  <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              ))}
              
              {/* Show loading placeholders for remaining images */}
              {Array.from({ length: totalImagesToGenerate - generatedImages.length }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-border"
                >
                  <Skeleton className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Sparkles className="w-6 h-6 text-muted-foreground mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground">{t("generateImages.generating")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

