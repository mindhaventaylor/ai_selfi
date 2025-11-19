import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Mail, Box } from "lucide-react";

export default function Empresas() {
  const features = [
    "Crea 1 Modelo IA",
    "40 créditos",
    "40 fotos",
    "Elige 10 Estilos y Atuendos",
    "Soporte premium",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Planes Empresariales
          </h1>
          <p className="text-lg text-muted-foreground">
            Fotos profesionales de IA para equipos y empresas (mínimo 5 personas)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Plan Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Box className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Plan Info */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Plan Empresarial</h2>
                  <p className="text-sm text-muted-foreground">
                    40 créditos por persona
                  </p>
                  <div className="text-4xl font-bold text-primary mt-4">
                    $15
                    <span className="text-lg text-muted-foreground font-normal">
                      {" "}por persona
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Buy Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Comprar Créditos
                </Button>

                {/* Payment Terms */}
                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Pago único. Sin suscripción.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    100% reembolsable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Quote Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8">
              <div className="space-y-6 h-full flex flex-col">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-3 flex-1">
                  <h2 className="text-xl font-bold">
                    ¿Necesitas una Cotización Personalizada?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Para pedidos grandes, paquetes de equipo o requisitos
                    personalizados, contáctanos.
                  </p>
                </div>

                {/* Contact Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={() => (window.location.href = "mailto:hola@aiselfi.es")}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  hola@aiselfi.es
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

