import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Box, Star, Zap, Gift, Building2 } from "lucide-react";

export default function BuyCredits() {
  const [, setLocation] = useLocation();

  const starterFeatures = [
    "Crea 1 Modelo IA",
    "40 fotos",
    "Elige Estilos y Outfits",
    "Imágenes en Resolución 2K",
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
      question: "¿Expiran los créditos?",
      answer:
        "No, los créditos no expiran. Lo que si expira a los 30 días es el modelo de IA que entrenaste. Debes usar tus creditos dentro de ese tiempo.",
    },
    {
      question: "¿Qué estilo de fotos recibiré?",
      answer:
        "Una vez que tu modelo de IA esté entrenado, podrás seleccionar diferentes estilos desde la pestaña Crear. Cada vez que generes una foto en un estilo seleccionado, recibirás 4 variantes diferentes en ese estilo. Esto te permite experimentar con varios looks y elegir tus favoritos.",
    },
    {
      question: "¿Cuánto se demoran en generar las fotos?",
      answer:
        "El proceso ocurre en dos pasos: Primero, entrenamos tu modelo de IA, lo que toma entre 15-30 minutos. Después de eso, puedes generar fotos en cualquier momento, y cada generación toma solo 1-2 minutos para crear 4 variantes.",
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Créditos</h1>
          <p className="text-lg text-muted-foreground">
            Compra créditos para crear tus fotos con IA.
          </p>
        </div>

        {/* Alternative Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          <Card className="bg-card/50 border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/dashboard/credits/gift-cards")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Gift Cards</h3>
                  <p className="text-sm text-muted-foreground">
                    Regala AI selfies a amigos y familia.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                >
                  Comprar Gift Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/dashboard/credits/empresas")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Para Empresas</h3>
                  <p className="text-sm text-muted-foreground">
                    Fotos profesionales de IA para equipos y empresas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                >
                  Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Starter Pack */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Box className="w-8 h-8 text-blue-400" />
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
                  Comprar
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
                    40 CREDITOS PRO
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
                  Comprar
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
          <Card className="bg-card/50 border-border">
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
                    60 CREDITOS PRO
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
                  Comprar
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

