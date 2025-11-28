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
import { Check, Box, Star, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { detectCurrency, getLocalizedPrice } from "@/utils/currency";

export default function BuyCredits() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [loadingPackId, setLoadingPackId] = useState<number | null>(null);
  const currency = detectCurrency();

  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  const { data: packs } = trpc.payment.listPacks.useQuery();

  // Get localized prices
  const starterPrice = getLocalizedPrice("starter", currency);
  const proPrice = getLocalizedPrice("pro", currency);
  const premiumPrice = getLocalizedPrice("premium", currency);

  const starterFeatures = t("buyCredits.starterFeatures", { returnObjects: true }) as string[];
  const proFeatures = t("buyCredits.proFeatures", { returnObjects: true }) as string[];
  const proCreditsFeatures = t("buyCredits.proCreditsFeatures", { returnObjects: true }) as string[];
  const premiumFeatures = t("buyCredits.premiumFeatures", { returnObjects: true }) as string[];
  const premiumCreditsFeatures = t("buyCredits.premiumCreditsFeatures", { returnObjects: true }) as string[];
  const faqItems = t("buyCredits.faq", { returnObjects: true }) as Array<{ q: string; a: string }>;

  const handleBuyClick = async (packId: number | null) => {
    if (!packId) {
      toast.error(t("buyCredits.packNotFound"));
      return;
    }

    try {
      setLoadingPackId(packId);
      console.log("[BuyCredits] Creating checkout session for pack:", packId, "currency:", currency);
      
      const result = await createCheckoutMutation.mutateAsync({ 
        packId,
        currency: currency,
      });
      console.log("[BuyCredits] Checkout session created:", result);
      
      if (result?.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        console.error("[BuyCredits] No URL in result:", result);
        toast.error(t("buyCredits.checkoutFailed"));
        setLoadingPackId(null);
      }
    } catch (error: any) {
      console.error("[BuyCredits] Checkout error:", error);
      toast.error(error?.message || t("buyCredits.checkoutStartFailed"));
      setLoadingPackId(null);
    }
  };

  // Map hardcoded packs to database packs by price
  // Base prices in USD: Starter = $29, Pro = $39, Premium = $49
  // We need to find packs by their base USD price, regardless of currency
  const getPackIdByBasePrice = (basePriceUSD: number): number | null => {
    if (!packs || packs.length === 0) return null;
    // Find pack with matching base USD price (convert to cents for comparison)
    // Packs in database should have base USD prices
    const pack = packs.find(p => Math.round(parseFloat(p.price.toString()) * 100) === basePriceUSD * 100);
    return pack?.id || null;
  };

  const starterPackId = getPackIdByBasePrice(29);
  const proPackId = getPackIdByBasePrice(39);
  const premiumPackId = getPackIdByBasePrice(49);

  // Debug: log packs
  if (packs && packs.length > 0) {
    console.log("[BuyCredits] Available packs:", packs);
    console.log("[BuyCredits] Pack IDs - Starter:", starterPackId, "Pro:", proPackId, "Premium:", premiumPackId);
  } else {
    console.warn("[BuyCredits] No packs found in database");
  }

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


        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Starter Pack */}
          <Card className="bg-blue-500/10 border-blue-500/20">
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
                    {starterPrice.formatted}
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
                  onClick={() => handleBuyClick(starterPackId)}
                  disabled={!starterPackId || loadingPackId === starterPackId}
                >
                  {loadingPackId === starterPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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
          <Card className="bg-yellow-500/10 border-yellow-500/20 relative">
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
                    <span>{proPrice.formatted}</span>
                    <span className="text-xl text-muted-foreground line-through font-normal">
                      {premiumPrice.formatted}
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
                  onClick={() => handleBuyClick(proPackId)}
                  disabled={!proPackId || loadingPackId === proPackId}
                >
                  {loadingPackId === proPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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
          <Card className="bg-purple-500/10 border-purple-500/20">
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
                    {premiumPrice.formatted}
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
                  onClick={() => handleBuyClick(premiumPackId)}
                  disabled={!premiumPackId || loadingPackId === premiumPackId}
                >
                  {loadingPackId === premiumPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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
            {faqItems && faqItems.length > 0 ? (
              faqItems.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-border bg-card/50 rounded-lg px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                    {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                    {item.a}
                </AccordionContent>
              </AccordionItem>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t("buyCredits.noFaq")}
              </div>
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

