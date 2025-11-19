import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
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

export default function GenerateImages() {
  const { user } = useAuth();
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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch user's models
  const { data: modelsData, isLoading: isLoadingModels } = trpc.model.list.useQuery();
  const generateMutation = trpc.photo.generate.useMutation();
  
  // Fetch training images for selected model
  const { data: trainingImages } = trpc.model.getTrainingImages.useQuery(
    { modelId: parseInt(modelId) },
    { enabled: !!modelId && modelId !== "" }
  );

  const backgrounds = ["office", "neutral", "studio"];
  const styles = ["formal", "casual", "elegant", "professional"];

  const exampleImages = [
    { id: 1, url: "/image.webp", badge: "Premium" },
    { id: 2, url: "/image_1.webp", badge: "New" },
    { id: 3, url: "/image_10.webp", badge: null },
    { id: 4, url: "/image_100.jpg", badge: "Popular" },
    { id: 5, url: "/image_101.jpg", badge: null },
    { id: 6, url: "/image_102.jpg", badge: "Premium" },
  ];

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
      alert("Por favor selecciona un modelo válido");
      return;
    }

    // Build reference image URLs:
    // 1. First, add the model's training images (up to 4) - these are sent in the background
    // 2. Then, add the selected example images for style reference
    const referenceImageUrls: string[] = [];
    
    // Add model's training images (up to 4) - these are used for the actual person
    if (trainingImages && trainingImages.length > 0) {
      referenceImageUrls.push(...trainingImages.slice(0, 4));
    } else if (selectedModel.previewImageUrl) {
      // Fallback to preview image if training images aren't loaded yet
      referenceImageUrls.push(selectedModel.previewImageUrl);
    }
    
    if (referenceImageUrls.length === 0) {
      alert("No se encontraron imágenes de entrenamiento para este modelo");
      return;
    }
    
    // Add selected example images for style reference
    const selectedExampleImages = exampleImages.filter((img) => selectedImages.includes(img.id));
    const exampleImageUrls = selectedExampleImages.map((img) => {
      // Convert relative URLs to absolute URLs
      if (img.url.startsWith('http://') || img.url.startsWith('https://')) {
        return img.url;
      }
      if (img.url.startsWith('/')) {
        return `${window.location.origin}${img.url}`;
      }
      return img.url;
    });
    
    // Combine: training images first (for the person), then example images (for style)
    const absoluteUrls = [...referenceImageUrls, ...exampleImageUrls];
    
    // Reset state
    setIsGenerating(true);
    setGenerationProgress(0);
    setCompletedImages(0);
    setGeneratedImages([]);
    setErrorMessage(null);
    setShowModal(true);
    
    try {
      // Simulate progress updates while generating
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) return prev; // Don't go to 100% until done
          return prev + 2;
        });
      }, 200);

      // Call the API
      const result = await generateMutation.mutateAsync({
        modelId: parseInt(modelId),
        referenceImageUrls: absoluteUrls,
        aspectRatio,
        glasses: glasses as "yes" | "no",
        hairColor: hairColor !== "default" ? hairColor : undefined,
        hairStyle: hairStyle !== "no-preference" ? hairStyle : undefined,
        backgrounds: selectedBackgrounds,
        styles: selectedStyles,
        numImagesPerReference: 4,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGeneratedImages(result.imageUrls);
      setCompletedImages(result.imageUrls.length);
      setIsGenerating(false);
    } catch (error: any) {
      console.error("Error generating images:", error);
      clearInterval(progressInterval);
      setIsGenerating(false);
      
      // Show error in modal instead of alert
      const errorMsg = error?.message || "Error al generar las imágenes. Por favor intenta de nuevo.";
      setErrorMessage(errorMsg);
      
      // Don't close modal on error - let user see the error and retry
      // setShowModal(false);
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
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
            <h1 className="text-3xl md:text-4xl font-bold">Elige tus Imágenes</h1>

            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Género</label>
              <div className="flex gap-3">
                <Button
                  variant={gender === "man" ? "default" : "outline"}
                  onClick={() => setGender("man")}
                  className={gender === "man" ? "bg-primary" : ""}
                >
                  Man
                </Button>
                <Button
                  variant={gender === "woman" ? "default" : "outline"}
                  onClick={() => setGender("woman")}
                  className={gender === "woman" ? "bg-primary" : ""}
                >
                  Woman
                </Button>
              </div>
            </div>

            {/* Filter Images */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Background</label>
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
                <label className="text-sm font-medium">Style</label>
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
                      Múltiples Variaciones
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cada imagen seleccionada generará 4 variaciones únicas en ese estilo. ¡Clickea las imágenes de referencia favoritas para comenzar!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Images Grid - User selects style images */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Imágenes de Entrenamiento del Modelo</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona las imágenes de referencia para elegir el estilo de tus fotos generadas
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {exampleImages.map((image) => (
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
                      alt={`Reference ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                    {image.badge && (
                      <Badge
                        className={`absolute top-2 right-2 ${
                          image.badge === "Premium"
                            ? "bg-purple-500"
                            : image.badge === "New"
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
                ))}
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
                      <h2 className="text-xl font-bold">Parámetros</h2>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-6 space-y-6">
                      {/* Model ID */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">Modelo</label>
                        </div>
                        <Select value={modelId} onValueChange={setModelId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingModels ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Cargando modelos...
                              </div>
                            ) : modelsData && modelsData.length > 0 ? (
                              modelsData.map((model) => (
                                <SelectItem 
                                  key={model.id} 
                                  value={model.id.toString()}
                                  disabled={model.status !== "ready"}
                                >
                                  {model.name} {model.gender ? `(${model.gender})` : ""} 
                                  {model.status === "training" && " - Entrenando..."}
                                  {model.status === "failed" && " - Fallido"}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No hay modelos disponibles
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {!modelId && modelsData && modelsData.length === 0 && "Primero necesitas entrenar un modelo"}
                          {!modelId && modelsData && modelsData.length > 0 && "Selecciona un modelo para generar imágenes"}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "training" && "Este modelo aún está entrenando. Espera a que termine."}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "failed" && "Este modelo falló. Por favor entrena uno nuevo."}
                        </p>
                      </div>

                      {/* Image Dimensions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">Dimensiones de la Imagen</label>
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
                          Aspecto de la imagen
                        </p>
                      </div>

                      {/* Glasses */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Glasses className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">Usas Gafas</label>
                        </div>
                        <Select value={glasses} onValueChange={setGlasses}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Agregar gafas a las imágenes generadas
                        </p>
                      </div>

                      {/* Hair Color */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            Color de Pelo (opcional)
                          </label>
                        </div>
                        <Select value={hairColor} onValueChange={setHairColor}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Predeterminado</SelectItem>
                            <SelectItem value="black">Negro</SelectItem>
                            <SelectItem value="brown">Marrón</SelectItem>
                            <SelectItem value="blonde">Rubio</SelectItem>
                            <SelectItem value="red">Rojo</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Elige el color de pelo para tus imágenes generadas
                        </p>
                      </div>

                      {/* Hair Style */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            Estilo de Pelo (opcional)
                          </label>
                        </div>
                        <Select value={hairStyle} onValueChange={setHairStyle}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-preference">Sin preferencia</SelectItem>
                            <SelectItem value="short">Corto</SelectItem>
                            <SelectItem value="medium">Medio</SelectItem>
                            <SelectItem value="long">Largo</SelectItem>
                            <SelectItem value="curly">Rizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Selecciona un estilo de pelo específico para las imágenes generadas
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
                          Generar {totalImagesToGenerate} Imágenes
                        </Button>
                        
                        {/* Credits Usage */}
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {imageCount === 0 
                              ? "Selecciona imágenes para generar"
                              : !hasEnoughCredits
                              ? `No tienes suficientes créditos (necesitas ${creditsNeeded}, tienes ${userCredits})`
                              : modelId === ""
                              ? "Selecciona un modelo primero"
                              : `Esto usará ${creditsNeeded} ${creditsNeeded === 1 ? 'crédito' : 'créditos'}`
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
                Tus fotos profesionales están casi listas
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
                      Error al generar imágenes
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
                          Reintentar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowModal(false)}
                        >
                          Cerrar
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
                  <span className="text-sm font-medium">Progreso</span>
                  <span className={`text-sm font-bold ${generationProgress === 100 ? 'text-green-500' : 'text-primary'}`}>
                    {generationProgress}%
                  </span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedImages} de {totalImagesToGenerate} imágenes completadas
                </p>
              </div>
            )}

            {/* Info Message - Only show if not error and generating */}
            {!errorMessage && isGenerating && (
              <p className="text-sm text-muted-foreground">
                Generando tus fotos profesionales... Por favor espera.
              </p>
            )}

            {/* Success Message */}
            {!errorMessage && !isGenerating && generatedImages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Puedes cerrar esta ventana. Tus fotos aparecen en galería
              </p>
            )}
          </div>

          {/* Images Grid - Scrollable */}
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Show generated images */}
              {generatedImages.map((imageUrl, index) => (
                <div
                  key={`generated-${index}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all cursor-pointer"
                  onClick={() => handleDownloadImage(imageUrl, index)}
                >
                  <img
                    src={imageUrl}
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
                      <p className="text-xs text-muted-foreground">Generando...</p>
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

