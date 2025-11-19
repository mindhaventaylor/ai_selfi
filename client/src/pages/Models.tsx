import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

export default function Models() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlaskConical className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Modelos</h1>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Train New Model Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8">
              <div className="space-y-6 text-center">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FlaskConical className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold">Entrenar Nuevo Modelo</h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  Empieza entrenando tu primer modelo
                </p>

                {/* Button */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Entrenar Modelo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* View Trained Models Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8">
              <div className="space-y-6 text-center">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FlaskConical className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold">Ver Modelos Entrenados</h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  Consulta el estado de tus modelos entrenados o ajusta tus imágenes
                </p>

                {/* Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Ver Modelos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

