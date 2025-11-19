import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Gift, Star, Zap } from "lucide-react";

export default function GiftCards() {
  const starterFeatures = [
    "Crea 1 Modelo IA",
    "40 fotos",
    "Imágenes en Resolución 2K",
    "Elige Estilos y Outfits",
  ];

  const proFeatures = [
    "Crea 1 Modelo IA",
    "100 fotos",
    "Imágenes en Alta Resolución 4K",
    "Elige Estilos y Outfits",
    "Estilos Premium",
  ];

  const proCreditsFeatures = [
    "Texto a Imagen",
    "Edición de Fondo",
    "Transferencia de Estilo",
    "Miniaturas de YouTube",
    "y más",
  ];

  const premiumFeatures = [
    "Crea 2 Modelos IA",
    "150 fotos",
    "Imágenes en Alta Resolución 4K",
    "Elige Estilos y Outfits",
    "Estilos Premium",
    "Soporte premium",
    "Acceso anticipado a nuevas funciones",
  ];

  const premiumCreditsFeatures = [
    "Texto a Imagen",
    "Edición de Fondo",
    "Transferencia de Estilo",
    "Miniaturas de YouTube",
    "y más",
  ];

  const faqItems = [
    {
      question: "¿Cómo funcionan las tarjetas de regalo?",
      answer:
        "Cuando compras una tarjeta de regalo, recibirás un código único que puedes compartir con cualquier persona. El destinatario puede usar este código durante la compra para canjear el valor completo del paquete de la tarjeta de regalo.",
    },
    {
      question: "¿Se pueden usar las tarjetas de regalo varias veces?",
      answer:
        "No, cada código de tarjeta de regalo solo se puede usar una vez. El valor completo del paquete se aplicará cuando se canjee el código.",
    },
    {
      question: "¿Expiran las tarjetas de regalo?",
      answer:
        "No, nuestras tarjetas de regalo nunca expiran. El destinatario puede usarlas cuando esté listo para crear sus fotos generadas por IA.",
    },
    {
      question: "¿Qué pasa si compro el paquete equivocado?",
      answer:
        "Cada tarjeta de regalo es específica al paquete comprado (Inicial, Pro o Premium). El destinatario recibirá exactamente lo que está incluido en ese paquete.",
    },
    {
      question: "¿Cómo recibiré la tarjeta de regalo?",
      answer:
        "Después del pago exitoso, serás redirigido a una página de confirmación que muestra tu código único de tarjeta de regalo. Puedes copiar este código y compartirlo con el destinatario.",
    },
    {
      question: "¿Qué estilo de fotos recibiré?",
      answer:
        "Una vez que tu modelo de IA esté entrenado, podrás seleccionar diferentes estilos desde la pestaña Crear. Cada vez que generes una foto en un estilo seleccionado, recibirás 4 variantes diferentes en ese estilo. Esto te permite experimentar con varios looks y elegir tus favoritos.",
    },
    {
      question: "¿Cuánto se demoran en generar las fotos?",
      answer:
        "El proceso ocurre en dos pasos: Primero, entrenamos tu modelo de IA, lo que toma entre 15-25 minutos. Después de eso, puedes generar fotos en cualquier momento, y cada generación toma solo 1-2 minutos para crear 4 variantes.",
    },
    {
      question: "¿Ofrecen reembolso?",
      answer:
        "Sí, ofrecemos una garantía de devolución del 100% si no estás satisfecho con la calidad de tus fotos. Puedes solicitar un reembolso completo dentro de los primeros 7 días después de tu compra.",
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer:
        "Procesamos todas las transacciones utilizando Stripe. Puedes pagar usando tarjeta de crédito, PayPal, Apple Pay, Google Pay y más.",
    },
    {
      question: "¿Cómo aseguro la calidad de mis fotos?",
      answer:
        "Antes de entrenar un modelo, te recomendamos leer nuestra guía. De esta manera te asegurarás de que las fotos generadas sean de la mejor calidad posible.",
    },
    {
      question: "¿Quiénes pueden usar mis fotos y qué hay de la privacidad?",
      answer:
        "Tus fotos son exclusivamente tuyas. Priorizamos tu privacidad y eliminamos automáticamente todas las fotos generadas de nuestra base de datos después de 30 días. Las fotos que generes son para tu uso personal y no serán compartidas ni accesibles para nadie más.",
    },
    {
      question: "¿Qué pasa si las fotos generadas no se parecen a mí?",
      answer:
        "Si sigues nuestras instrucciones para seleccionar las imágenes de entrenamiento, deberías obtener alrededor del 80% de fotos utilizables que se parezcan a ti. Continuamente actualizamos nuestros modelos para mejorar la precisión. Si tienes dudas antes de comenzar, no dudes en contactarnos para obtener orientación.",
    },
    {
      question: "¿El AI aprenderá mis características únicas?",
      answer:
        "Sí, nuestra IA es excelente para entender y replicar lo que te hace único. También puedes ajustar características específicas al generar imágenes, como si llevas gafas u otras características distintivas.",
    },
    {
      question: "¿Dónde puedo usar estas fotos?",
      answer:
        "Las fotos son versátiles y pueden usarse en cualquier lugar donde necesites una imagen profesional tuya. Son perfectas para fotos de perfil profesional (LinkedIn, sitios web de empresas), redes sociales (Instagram, Facebook, Twitter) o marca personal. Puedes elegir diferentes dimensiones como formato cuadrado para fotos de perfil o modo retrato para historias de Instagram y otros diseños verticales.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gift Cards</h1>
          <p className="text-lg text-muted-foreground">
            Regala AlSelfi.es a amigos y familia.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Starter Pack */}
          <Card className="bg-card/50 border-border relative">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* Plan Info */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Starter Pack</h2>
                  <p className="text-sm text-muted-foreground">40 créditos</p>
                  <div className="text-4xl font-bold text-primary mt-4">
                    $29
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {starterFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Buy Button */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Comprar Gift Card
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

          {/* Pro Pack */}
          <Card className="bg-card/50 border-border relative">
            <Badge className="absolute -top-3 right-4 bg-yellow-500 text-yellow-900 border-yellow-500">
              Most Popular
            </Badge>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Star className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>

                {/* Plan Info */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Pro Pack</h2>
                  <p className="text-sm text-muted-foreground">100 créditos</p>
                  <div className="text-4xl font-bold text-primary mt-4 flex items-center justify-center gap-2">
                    <span>$39</span>
                    <span className="text-xl text-muted-foreground line-through font-normal">
                      $49
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {proFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* PRO Credits Section */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-yellow-400 mb-2">
                    40 PRO CREDITS
                  </p>
                  <div className="space-y-2">
                    {proCreditsFeatures.map((feature, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        • {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy Button */}
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Comprar Gift Card
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

          {/* Premium Pack */}
          <Card className="bg-card/50 border-border relative">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Plan Info */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Premium Pack</h2>
                  <p className="text-sm text-muted-foreground">150 créditos</p>
                  <div className="text-4xl font-bold text-primary mt-4">
                    $49
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* PRO Credits Section */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-purple-400 mb-2">
                    60 PRO CREDITS
                  </p>
                  <div className="space-y-2">
                    {premiumCreditsFeatures.map((feature, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        • {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Comprar Gift Card
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
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Preguntas Frecuentes
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqItems.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-border bg-card/50 rounded-lg px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

