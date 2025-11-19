import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Scissors
} from "lucide-react";

export default function GenerateImages() {
  const [gender, setGender] = useState<"man" | "woman">("man");
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("9:16");
  const [modelId, setModelId] = useState<string>("");
  const [glasses, setGlasses] = useState<string>("no");
  const [hairColor, setHairColor] = useState<string>("default");
  const [hairStyle, setHairStyle] = useState<string>("no-preference");

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

  const toggleImage = (id: number) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const imageCount = selectedImages.length;
  const creditsNeeded = imageCount * 4; // 4 variations per image

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex gap-6">
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

            {/* Example Images Grid */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Imágenes de Referencia</h2>
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
          <div className="w-[380px] shrink-0">
            <Card className="bg-card/50 border-border sticky top-20">
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
                          <label className="text-sm font-medium">ID del Modelo</label>
                        </div>
                        <Select value={modelId} onValueChange={setModelId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="model-1">Modelo 1</SelectItem>
                            <SelectItem value="model-2">Modelo 2</SelectItem>
                            <SelectItem value="model-3">Modelo 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Identificador del modelo entrenado
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
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                          size="lg"
                          disabled={imageCount === 0}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generar {imageCount * 4} Imágenes
                        </Button>
                        
                        {/* Credits Usage */}
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Esto usará {creditsNeeded} créditos</span>
                          <span className="text-xs font-medium">({creditsNeeded})</span>
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
    </div>
  );
}

