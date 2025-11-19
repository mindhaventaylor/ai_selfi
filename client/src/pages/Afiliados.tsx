import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Zap, Hand, Share2, DollarSign, Check } from "lucide-react";

export default function Afiliados() {

  const faqItems = [
    {
      question: "¿Cómo funciona el programa de afiliados?",
      answer:
        "Obtendrás un enlace único de afiliado para compartir. Cuando alguien se registre usando tu enlace y haga una compra, ganarás una comisión del 30% por cada venta que generes.",
    },
    {
      question: "¿Cuándo me pagan?",
      answer:
        "Procesamos los pagos mensualmente para todas las comisiones ganadas en el mes anterior.",
    },
    {
      question: "¿Hay un pago mínimo?",
      answer:
        "Sí, el pago mínimo es de $25. Una vez que alcances este umbral, procesaremos tu pago en el siguiente ciclo de pagos.",
    },
  ];

  const benefits = [
    "30% de comisión por cada venta que generes",
    "Ingresos pasivos",
    "Período de atribución de 60 días",
    "Pagos mensuales",
    "Páginas de destino de alta conversión",
    "Soporte dedicado para afiliados",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="w-full bg-gradient-to-b from-background via-background to-background/95">
          <div className="max-w-5xl mx-auto flex items-center justify-center flex-col py-32 space-y-8 text-center p-6">
            <div className="flex items-center justify-center space-y-4 flex-col">
              {/* Badge */}
              <div className="-mb-2 flex justify-center select-none md:-mb-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-full">
                  <Zap className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="text-sm font-medium text-white/90">
                    Programa de Afiliados
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl md:leading-tight mb-8">
                Gana el 30% de Comisión por cada venta que generes
              </h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-3xl mb-8">
                Únete al programa de afiliados de AISelfi.es y comienza a generar
                ingresos pasivos promocionando nuestra herramienta de creación de
                fotos de perfil con IA.
              </p>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => window.open("https://aiselfies.tolt.io/", "_blank")}
            >
              ¡Regístrate como Afiliado!
            </Button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="container mx-auto max-w-6xl p-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl md:leading-tight mb-12">
              Cómo Funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Step 1 */}
            <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-full w-fit mb-4">
                  <span className="text-sm font-medium text-white/90">Paso 1</span>
                </div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Hand className="w-6 h-6" />
                  Regístrate
                </h3>
                <p className="text-lg mb-4">Crea tu cuenta de afiliado gratuita</p>
                <p className="text-base text-muted-foreground">
                  Regístrate en solo unos minutos. No se requiere tarjeta de crédito.
                  Obtén acceso instantáneo a tu panel de afiliado y materiales de
                  marketing.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-full w-fit mb-4">
                  <span className="text-sm font-medium text-white/90">Paso 2</span>
                </div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Share2 className="w-6 h-6" />
                  Comparte
                </h3>
                <p className="text-lg mb-4">
                  Promociona AISelfi.es con tu enlace único
                </p>
                <p className="text-base text-muted-foreground">
                  Comparte tu enlace único de afiliado en tu blog, redes sociales o
                  con tu red de contactos.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-full w-fit mb-4">
                  <span className="text-sm font-medium text-white/90">Paso 3</span>
                </div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Gana
                </h3>
                <p className="text-lg mb-4">
                  Obtén el 30% de comisión por cada venta que generes
                </p>
                <p className="text-base text-muted-foreground">
                  Nuestras páginas de destino de alta conversión y excelente producto
                  garantizan grandes tasas de conversión.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Join Section */}
        <div className="container mx-auto max-w-6xl p-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl md:leading-tight mb-12">
              ¿Por Qué Unirse a Nuestro Programa de Afiliados?
            </h2>
          </div>

          <ul className="grid md:grid-cols-2 gap-6 mb-20 justify-items-center">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center w-full max-w-md">
                <Check className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto max-w-6xl p-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl md:leading-tight mb-12">
              Preguntas Frecuentes
            </h2>
          </div>

          <Card className="p-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 mb-20">
            <CardContent className="p-0">
              <div className="space-y-8">
                {faqItems.map((item, idx) => (
                  <div key={idx} className="border-b border-white/10 last:border-0 pb-8 last:pb-0">
                    <h3 className="text-xl font-black mb-2">{item.question}</h3>
                    <p className="text-lg text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA Section */}
        <div className="container mx-auto max-w-6xl p-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl md:leading-tight mb-6">
              ¿Listo para Empezar a Ganar?
            </h2>
            <p className="text-lg mb-12">
              ¡Únete hoy a nuestro programa de afiliados y comienza a generar
              ingresos pasivos!
            </p>
          </div>
          <div className="py-20 text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => window.open("https://aiselfies.tolt.io/", "_blank")}
            >
              ¡Únete al Programa de Afiliados!
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

