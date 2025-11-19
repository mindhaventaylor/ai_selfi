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
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock photos for the grid background
  const gridPhotos = [
    "/image.webp",
    "/image_1.webp",
    "/image_10.webp",
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
      title: "Paso 1: Comprar Créditos",
      icon: CreditCard,
      color: "blue",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: 2,
      title: "Paso 2: Entrenar un Modelo de IA - Consejos para Mejores Resultados",
      icon: FlaskConical,
      color: "yellow",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      id: 3,
      title: "Paso 3: Creando tus Fotos",
      icon: Sparkles,
      color: "purple",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: 4,
      title: "Paso 4: Galería - Tus Fotos",
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
            Empieza aquí: Aprende cómo funciona AISelfi.es
          </h1>
          <p className="text-lg text-muted-foreground">
            Si es tu primera vez aquí, te sugiero ver el siguiente corto video
            para aprender cómo funciona la app.
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
                      alt={`Photo ${idx + 1}`}
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
                <h2 className="text-4xl md:text-5xl font-bold">AISelfies</h2>
                <p className="text-lg md:text-xl text-muted-foreground">
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

              {/* Video Player Section */}
              <div className="mt-8">
                <div className="aspect-video bg-muted rounded-lg relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                  {!isPlaying ? (
                    <div className="relative z-10 text-center space-y-4 px-4">
                      <h3 className="text-2xl md:text-3xl font-bold">
                        AISelfi.es en menos de 60'
                      </h3>
                      <p className="text-base md:text-lg text-muted-foreground">
                        Explique cómo funciona la app en menos de 60 segundos
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
                          Video placeholder
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Video will play here
                        </p>
                      </div>
                      <div className="w-full px-4">
                        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-center">
                          0:04 / 1:11
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Video Info */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm max-w-fit mx-auto">
                      {isPlaying ? "0:04 / 1:11" : "0:00 / 1:11"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Cómo funciona</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aprende el proceso
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido Section */}
        <Card className="bg-card/50 border-border mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Contenido</h2>
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

        {/* Step 1: Comprar Créditos */}
        <Card id="step-1" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Paso 1: Comprar Créditos
                </h2>
              </div>
            </div>

              <div className="space-y-4 text-sm">
                <p>
                  Elige entre nuestros paquetes de pago único. Cada paquete
                  incluye créditos tanto para entrenar modelos de IA como para
                  generar fotos.
                </p>
                <p>
                  Selecciona el paquete que mejor se adapte a tus necesidades.
                </p>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">
                    Cada paquete incluye:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      Créditos para entrenar modelos de IA (1 o 5 - dependiendo
                      del paquete elegido)
                    </li>
                    <li>
                      Créditos para generar fotos (1 crédito = 1 foto) [estos
                      son los créditos que se ven en tu perfil]
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Notas importantes:</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      Todos los paquetes son de pago único - sin suscripciones
                    </li>
                    <li>Los créditos nunca caducan</li>
                    <li>
                      Para tu privacidad y protección de datos, los modelos de
                      IA entrenados caducan automáticamente después de 30 días.
                    </li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${steps[0].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/credits/buy")}
                >
                  Comprar Créditos →
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 2: Entrenar un Modelo de IA */}
        <Card id="step-2" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Paso 2: Entrenar un Modelo de IA - Consejos para Mejores
                  Resultados
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tips y errores a evitar al entrenar tu modelo de IA. Qué
                  fotos elegir para entrenar tu modelo.
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-3">
                    Buenas fotos para el entrenamiento:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Fotos claras y bien iluminadas de tu rostro</li>
                    <li>Fotos tomadas desde diferentes ángulos</li>
                    <li>Expresiones naturales</li>
                    <li>Diferentes condiciones de iluminación</li>
                    <li>Fondos simples, sin distracciones</li>
                    <li>Imágenes de alta calidad y nitidez</li>
                    <li>
                      Primeros planos que muestren claramente tu rostro
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Fotos a evitar:</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Fotos grupales</li>
                    <li>Fotos borrosas o de baja calidad</li>
                    <li>Fotos con filtros o ediciones pesadas</li>
                    <li>Fotos con gafas de sol</li>
                    <li>Fotos con objetos que oculten el rostro</li>
                    <li>Selfies extremos o distorsionados</li>
                    <li>Fotos con maquillaje excesivo</li>
                    <li>Fotos muy antiguas o de baja resolución</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Para mejores resultados:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Sube entre 10-20 fotos de calidad</li>
                    <li>Asegúrate de que tu rostro sea claramente visible</li>
                    <li>Varía las expresiones y ángulos</li>
                    <li>Usa fotos recientes que te representen bien</li>
                    <li>Evita fotos muy similares entre sí</li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${steps[1].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/models")}
                >
                  Entrenar tu Modelo de IA →
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 3: Creando tus Fotos */}
        <Card id="step-3" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Paso 3: Creando tus Fotos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Aprende cómo crear fotos increíbles con IA.
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <p>
                  Mira el video de arriba para aprender cómo crear tus fotos
                  con IA.
                </p>

                <div>
                  <h3 className="font-semibold mb-3">Cómo crear fotos:</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Ve a la sección Create</li>
                    <li>Elige tu género (hombre/mujer)</li>
                    <li>
                      Usa los filtros para encontrar los estilos que te gusten
                    </li>
                    <li>
                      Haz clic en los estilos que quieres replicar (cada estilo
                      seleccionado crea 4 variantes)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Elige los parámetros:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Proporción de la imagen (1:1 o 9:16)</li>
                    <li>Uso de gafas (opcional)</li>
                    <li>Color de pelo (opcional)</li>
                    <li>Estilo de pelo (opcional)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Consejos para mejores resultados:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      Comienza con una foto de prueba sin parámetros
                    </li>
                    <li>
                      Si los resultados necesitan ajustes, modifica los
                      parámetros
                    </li>
                    <li>Prueba diferentes categorías de estilo</li>
                    <li>Experimenta con varios looks</li>
                    <li>Genera múltiples sets</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Notas importantes:</h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>
                      Cada foto seleccionada usara 4 créditos (se crean 4 fotos
                      por cada estilo seleccionado)
                    </li>
                    <li>
                      Puedes generar tantas fotos como créditos tengas
                    </li>
                    <li>
                      Las fotos estarán disponibles en la Galería en 1-2
                      minutos después de la confirmación
                    </li>
                    <li>
                      Las fotos se guardan automáticamente en tu galería
                    </li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 ${steps[2].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/generate")}
                >
                  Crear tus Fotos con IA →
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Step 4: Galería */}
        <Card id="step-4" className="bg-card/50 border-border mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Paso 4: Galería - Tus Fotos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu galería es donde todas tus fotos generadas se guardan
                  automáticamente
                </p>
              </div>
            </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-3">
                    Qué puedes hacer en la galería:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Explorar todas tus fotos generadas</li>
                    <li>Ver fotos en pantalla completa</li>
                    <li>Hacer zoom para ver detalles</li>
                    <li>Marcar y guardar favoritos</li>
                    <li>Descargar fotos en alta calidad</li>
                    <li>Eliminar fotos no deseadas</li>
                    <li>Filtrar por fecha de creación</li>
                    <li>Ordenar por diferentes criterios</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Consejos para organizar tus fotos:
                  </h3>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Marca tus favoritos para acceso rápido</li>
                    <li>Usa el filtro de favoritos para ver solo las mejores</li>
                    <li>Descarga las fotos que más te gusten</li>
                    <li>
                      Elimina las fotos que no necesites para liberar espacio
                    </li>
                  </ul>
                </div>

                <Alert className="bg-yellow-500/20 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-sm">
                    <strong>Información importante:</strong> Todas tus fotos son
                    privadas y solo tú puedes acceder a ellas. Las fotos
                    permanecen en tu galería hasta que las elimines.
                  </AlertDescription>
                </Alert>

                <Button
                  className={`mt-6 ${steps[3].buttonColor} text-white rounded-full`}
                  onClick={() => setLocation("/dashboard/gallery")}
                >
                  Ver tu Galería →
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

