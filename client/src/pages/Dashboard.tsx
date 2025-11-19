import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  X, 
  ArrowDown, 
  Play, 
  Brain, 
  Image as ImageIcon,
  HelpCircle,
  ArrowRight
} from "lucide-react";

export default function Dashboard() {
  const [showAlert, setShowAlert] = useState(true);
  const [, setLocation] = useLocation();

  // Mock photos for the grid background
  const gridPhotos = [
    "/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.jpg",
    "/image_101.jpg", "/image_102.jpg", "/image_103.jpg", "/image_104.jpg",
    "/image_105.jpg", "/image_106.jpg", "/image_107.jpg", "/image_108.jpg",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Alert Banner */}
        {showAlert && (
          <Alert className="bg-green-500/20 border-green-500/50 text-green-50 max-w-4xl mx-auto">
            <Sparkles className="h-4 w-4 text-green-400" />
            <AlertDescription className="flex items-center justify-between w-full">
              <div>
                <div className="font-semibold">Nuevo modelo de IA disponible</div>
                <div className="text-sm opacity-90">Fotos más realistas y calidad 4k</div>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="ml-4 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 max-w-5xl mx-auto">
          <CardContent className="p-8 md:p-12 relative z-10">
            {/* Background Grid of Photos */}
            <div className="absolute inset-0 opacity-10 z-0">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-4 h-full">
                {gridPhotos.map((photo, idx) => (
                  <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 text-center space-y-4 md:space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">AISelfi.es</h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground">
                Convierte tus selfies en fotos profesionales
              </p>
              <Button
                size="lg"
                className="text-base md:text-lg px-8 md:px-10 py-6 md:py-7 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow"
                onClick={() => setLocation("/dashboard/generate")}
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Generar Imágenes →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Title with Arrow */}
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">AISelfi.es en 60"</h2>
            <ArrowDown className="h-5 w-5 md:h-6 md:w-6 animate-bounce" />
          </div>

          {/* Video Player Section */}
          <Card className="bg-card/50">
            <CardContent className="p-6 md:p-8">
              <div className="aspect-video bg-muted rounded-lg relative overflow-hidden flex items-center justify-center max-w-4xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                <div className="relative z-10 text-center space-y-3 md:space-y-4 px-4">
                  <h3 className="text-2xl md:text-3xl font-bold">AISelfies</h3>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Convierte tus selfies en fotos profesionales
                  </p>
                  <Button
                    size="lg"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light"
                    onClick={() => setLocation("/dashboard/generate")}
                  >
                    Generar Imágenes →
                  </Button>
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-30">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm max-w-fit mx-auto">
                    0:00 / 1:11
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {/* Train Model Card */}
            <Card className="bg-card/50">
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Brain className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <h3 className="text-lg md:text-xl font-bold">Entrenar un modelo</h3>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                    Nuevo modelo de IA
                  </Badge>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Crea tu IA personalizada</p>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 md:mb-4">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-yellow-500/5">
                    <div className="text-center space-y-2">
                      <Play className="w-6 h-6 md:w-8 md:h-8 mx-auto text-yellow-400" />
                      <div className="text-xs text-muted-foreground">0:00 / 1:11</div>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm md:text-base"
                  size="lg"
                >
                  Comenzar Entrenamiento →
                </Button>
              </CardContent>
            </Card>

            {/* Gallery Card */}
            <Card className="bg-card/50">
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h3 className="text-lg md:text-xl font-bold">Galería</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Explora creaciones</p>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 md:mb-4 grid grid-cols-3 gap-1">
                  {gridPhotos.slice(0, 6).map((photo, idx) => (
                    <div key={idx} className="aspect-square overflow-hidden">
                      <img
                        src={photo}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm md:text-base"
                  size="lg"
                >
                  Ver Galería →
                </Button>
              </CardContent>
            </Card>

            {/* How It Works Card */}
            <Card className="bg-card/50">
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h3 className="text-lg md:text-xl font-bold">Cómo funciona</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Aprende el proceso</p>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 md:mb-4 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-green-500/5">
                  <Play className="w-10 h-10 md:w-12 md:h-12 text-green-400" />
                </div>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full text-sm md:text-base"
                  size="lg"
                >
                  Más Información →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
