import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, HelpCircle, BookOpen, ArrowRight } from "lucide-react";

export default function SupportGeneral() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Centro de Soporte</h1>
        </div>

        {/* Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Us Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">Contáctenos</h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center">
                  ¿Necesita ayuda? Nuestro equipo de soporte está aquí para
                  ayudarle.
                </p>

                {/* Email Button */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                  onClick={() => (window.location.href = "mailto:hola@aiselfi.es")}
                >
                  hola@aiselfi.es
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">
                  Preguntas Frecuentes
                </h2>

                {/* FAQ Items */}
                <div className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      ¿Cómo empiezo?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Regístrese para obtener una cuenta y siga nuestra guía de
                      inicio rápido para comenzar a usar nuestros servicios.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      ¿Qué métodos de pago aceptan?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Aceptamos todas las tarjetas de crédito principales y
                      PayPal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">
                  Documentación
                </h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center">
                  Explore nuestra documentación completa para obtener guías y
                  tutoriales detallados.
                </p>

                {/* Tutorial Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full"
                  onClick={() => setLocation("/dashboard/start")}
                >
                  Ver Tutorial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

