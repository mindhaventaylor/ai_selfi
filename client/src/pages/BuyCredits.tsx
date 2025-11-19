import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const starterFeatures = t("buyCredits.starterFeatures", { returnObjects: true }) as string[];
  const proFeatures = t("buyCredits.proFeatures", { returnObjects: true }) as string[];
  const proCreditsFeatures = t("buyCredits.proCreditsFeatures", { returnObjects: true }) as string[];
  const premiumFeatures = t("buyCredits.premiumFeatures", { returnObjects: true }) as string[];
  const premiumCreditsFeatures = t("buyCredits.premiumCreditsFeatures", { returnObjects: true }) as string[];
  const faqItems = t("buyCredits.faq", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("buyCredits.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("buyCredits.subtitle")}
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
                  <h3 className="font-semibold mb-1">{t("buyCredits.giftCards")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("buyCredits.giftCardsDesc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                >
                  {t("buyCredits.buyGiftCards")}
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
                  <h3 className="font-semibold mb-1">{t("buyCredits.forBusinesses")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("buyCredits.forBusinessesDesc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                >
                  {t("buyCredits.buy")}
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
                  <h2 className="text-2xl font-bold">{t("buyCredits.starterPack")}</h2>
                  <p className="text-sm text-muted-foreground">{t("buyCredits.starterCredits")}</p>
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
                  {t("buyCredits.buy")}
                </Button>

                {/* Payment Terms */}
                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.oneTimePayment")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.refundable")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Pack */}
          <Card className="bg-card/50 border-border relative">
            <Badge className="absolute -top-3 right-4 bg-yellow-500 text-yellow-900 border-yellow-500">
              {t("buyCredits.mostPopular")}
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
                  <h2 className="text-2xl font-bold">{t("buyCredits.proPack")}</h2>
                  <p className="text-sm text-muted-foreground">{t("buyCredits.proCredits")}</p>
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
                    {t("buyCredits.proCreditsLabel")}
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
                  {t("buyCredits.buy")}
                </Button>

                {/* Payment Terms */}
                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.oneTimePayment")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.refundable")}
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
                  <h2 className="text-2xl font-bold">{t("buyCredits.premiumPack")}</h2>
                  <p className="text-sm text-muted-foreground">{t("buyCredits.premiumCredits")}</p>
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
                    {t("buyCredits.premiumCreditsLabel")}
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
                  {t("buyCredits.buy")}
                </Button>

                {/* Payment Terms */}
                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.oneTimePayment")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("buyCredits.refundable")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            {t("buyCredits.faqTitle")}
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

