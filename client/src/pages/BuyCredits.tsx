import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/localStorage";
import { detectCurrency, getLocalizedPrice, getPage2Credits } from "@/utils/currency";

export default function BuyCredits() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [loadingPackId, setLoadingPackId] = useState<number | null>(null);
  const currency = detectCurrency();
  const { user } = useAuth();
  const { variant: posthogVariant } = usePostHogVariant(user?.id);
  const autoBuyRef = useRef<boolean>(false);
  
  // Check for page2 variant
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | null;
  const planParam = urlParams.get("plan") as "basic" | "standard" | "premium" | null;
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
  const isPage2Variant = posthogVariant === "page2" || urlVariant === "page2" || cachedVariant === "page2" || firstVariant === "page2";

  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  const { data: packs, isLoading: isLoadingPacks, error: packsError } = trpc.payment.listPacks.useQuery();
  
  // Debug: log packs loading state
  console.log("[BuyCredits] Packs loading:", isLoadingPacks, "Error:", packsError, "Packs:", packs);

  // Get localized prices (with page2 variant support)
  const starterPrice = getLocalizedPrice("starter", currency, isPage2Variant);
  const proPrice = getLocalizedPrice("pro", currency, isPage2Variant);
  const premiumPrice = getLocalizedPrice("premium", currency, isPage2Variant);
  
  // Get credits count for page2
  const starterCredits = isPage2Variant ? getPage2Credits("starter") : 40;
  const proCredits = isPage2Variant ? getPage2Credits("pro") : 100;
  const premiumCredits = isPage2Variant ? getPage2Credits("premium") : 150;

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
  // For page1: Starter = $29, Pro = $39, Premium = $49
  // For page2: Starter = $18, Pro = $25, Premium = $40
  const getPackIdByBasePrice = (basePriceUSD: number): number | null => {
    if (!packs || packs.length === 0) {
      console.warn("[BuyCredits] No packs available for price matching:", basePriceUSD);
      return null;
    }
    
    // Find pack with matching base USD price (convert to cents for comparison)
    // Packs in database should have base USD prices
    // Use a small tolerance (1 cent) to handle floating point precision issues
    const targetCents = Math.round(basePriceUSD * 100);
    
    // Log all packs for debugging
    console.log(`[BuyCredits] Searching for pack with price $${basePriceUSD} (${targetCents} cents). Available packs:`, 
      packs.map(p => {
        const packPrice = parseFloat(p.price.toString());
        const packCents = Math.round(packPrice * 100);
        return { 
          id: p.id, 
          price: packPrice, 
          priceCents: packCents,
          name: p.name,
          credits: p.credits,
          diff: Math.abs(packCents - targetCents)
        };
      })
    );
    
    const pack = packs.find(p => {
      const packPrice = parseFloat(p.price.toString());
      const packCents = Math.round(packPrice * 100);
      const match = Math.abs(packCents - targetCents) <= 1; // Allow 1 cent tolerance
      
      if (match) {
        console.log(`[BuyCredits] Found pack match: price=$${packPrice}, id=${p.id}, target=$${basePriceUSD}`);
      }
      
      return match;
    });
    
    if (!pack) {
      console.warn(`[BuyCredits] No pack found for price $${basePriceUSD} (${targetCents} cents). Available packs:`, 
        packs.map(p => ({ 
          id: p.id, 
          price: parseFloat(p.price.toString()), 
          priceCents: Math.round(parseFloat(p.price.toString()) * 100),
          name: p.name,
          credits: p.credits
        }))
      );
    }
    
    return pack?.id || null;
  };

  // Use different base prices based on variant
  let starterPackId = getPackIdByBasePrice(isPage2Variant ? 18 : 29);
  let proPackId = getPackIdByBasePrice(isPage2Variant ? 25 : 39);
  let premiumPackId = getPackIdByBasePrice(isPage2Variant ? 40 : 49);

  // Fallback: If packs not found by price, try to map by order (cheapest = starter, middle = pro, most expensive = premium)
  if (packs && packs.length > 0 && (!starterPackId || !proPackId || !premiumPackId)) {
    console.warn("[BuyCredits] Some packs not found by price, trying fallback mapping by order");
    const sortedPacks = [...packs].sort((a, b) => {
      const priceA = parseFloat(a.price.toString());
      const priceB = parseFloat(b.price.toString());
      return priceA - priceB;
    });
    
    console.log("[BuyCredits] Sorted packs by price:", sortedPacks.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price.toString()),
      credits: p.credits
    })));
    
    // Map: first pack = starter, second = pro, third = premium
    if (!starterPackId && sortedPacks.length >= 1) {
      starterPackId = sortedPacks[0].id;
      console.log(`[BuyCredits] Fallback: Mapped starter to pack ID ${starterPackId} (price: $${parseFloat(sortedPacks[0].price.toString())})`);
    }
    if (!proPackId && sortedPacks.length >= 2) {
      proPackId = sortedPacks[1].id;
      console.log(`[BuyCredits] Fallback: Mapped pro to pack ID ${proPackId} (price: $${parseFloat(sortedPacks[1].price.toString())})`);
    }
    if (!premiumPackId && sortedPacks.length >= 3) {
      premiumPackId = sortedPacks[2].id;
      console.log(`[BuyCredits] Fallback: Mapped premium to pack ID ${premiumPackId} (price: $${parseFloat(sortedPacks[2].price.toString())})`);
    }
    // If only 2 packs, use second as premium too
    if (!premiumPackId && sortedPacks.length === 2) {
      premiumPackId = sortedPacks[1].id;
      console.log(`[BuyCredits] Fallback: Only 2 packs, mapped premium to pack ID ${premiumPackId} (price: $${parseFloat(sortedPacks[1].price.toString())})`);
    }
  }

  // Map plan parameter to packId
  const getPackIdByPlan = (plan: "basic" | "standard" | "premium"): number | null => {
    if (plan === "basic") return starterPackId;
    if (plan === "standard") return proPackId;
    if (plan === "premium") return premiumPackId;
    return null;
  };

  // Auto-buy when plan parameter is present and packs are loaded
  useEffect(() => {
    if (planParam && !isLoadingPacks && packs && packs.length > 0 && !autoBuyRef.current) {
      const targetPackId = getPackIdByPlan(planParam);
      console.log("[BuyCredits] Auto-buy triggered for plan:", planParam, "packId:", targetPackId);
      
      if (targetPackId) {
        autoBuyRef.current = true;
        // Small delay to ensure UI is ready
        const timer = setTimeout(async () => {
          try {
            setLoadingPackId(targetPackId);
            console.log("[BuyCredits] Auto-creating checkout session for pack:", targetPackId, "currency:", currency);
            
            const result = await createCheckoutMutation.mutateAsync({ 
              packId: targetPackId,
              currency: currency,
            });
            console.log("[BuyCredits] Auto-checkout session created:", result);
            
            if (result?.url) {
              // Redirect to Stripe Checkout
              window.location.href = result.url;
            } else {
              console.error("[BuyCredits] No URL in auto-checkout result:", result);
              toast.error(t("buyCredits.checkoutFailed"));
              setLoadingPackId(null);
              autoBuyRef.current = false; // Reset to allow retry
            }
          } catch (error: any) {
            console.error("[BuyCredits] Auto-checkout error:", error);
            toast.error(error?.message || t("buyCredits.checkoutStartFailed"));
            setLoadingPackId(null);
            autoBuyRef.current = false; // Reset to allow retry
          }
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.warn("[BuyCredits] Could not find pack for plan:", planParam);
        toast.error(t("buyCredits.packNotFound"));
      }
    }
  }, [planParam, isLoadingPacks, packs, starterPackId, proPackId, premiumPackId, currency, createCheckoutMutation, t]);

  // Debug: log packs with detailed information
  if (packs && packs.length > 0) {
    console.log("[BuyCredits] ===== PACKS DEBUG INFO =====");
    console.log("[BuyCredits] Variant:", isPage2Variant ? "page2" : "page1");
    console.log("[BuyCredits] Plan param:", planParam);
    console.log("[BuyCredits] Available packs:", packs.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price.toString()),
      priceCents: Math.round(parseFloat(p.price.toString()) * 100),
      credits: p.credits
    })));
    console.log("[BuyCredits] Expected prices for page2: $18 (1800 cents), $25 (2500 cents), $40 (4000 cents)");
    console.log("[BuyCredits] Expected prices for page1: $29 (2900 cents), $39 (3900 cents), $49 (4900 cents)");
    console.log("[BuyCredits] Pack IDs - Starter:", starterPackId, "Pro:", proPackId, "Premium:", premiumPackId);
    console.log("[BuyCredits] ============================");
  } else if (!isLoadingPacks) {
    console.warn("[BuyCredits] No packs found in database after loading completed");
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
                  <p className="text-sm text-muted-foreground">
                    {isPage2Variant ? `${starterCredits} ${t("buyCredits.photos") || "photos"}` : t("buyCredits.starterCredits")}
                  </p>
                  <div className={`text-4xl font-bold text-primary mt-4 ${isPage2Variant && starterPrice.oldFormatted ? "flex items-center justify-center gap-2" : ""}`}>
                    <span>{starterPrice.formatted}</span>
                    {isPage2Variant && starterPrice.oldFormatted && (
                      <span className="text-xl text-muted-foreground line-through font-normal">
                        {starterPrice.oldFormatted}
                      </span>
                    )}
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
                  {isLoadingPacks ? t("buyCredits.loading") : loadingPackId !== null && loadingPackId === starterPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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
                  <p className="text-sm text-muted-foreground">
                    {isPage2Variant ? `${proCredits} ${t("buyCredits.photos") || "photos"}` : t("buyCredits.proCredits")}
                  </p>
                  <div className="text-4xl font-bold text-primary mt-4 flex items-center justify-center gap-2">
                    <span>{proPrice.formatted}</span>
                    {isPage2Variant && proPrice.oldFormatted ? (
                      <span className="text-xl text-muted-foreground line-through font-normal">
                        {proPrice.oldFormatted}
                      </span>
                    ) : !isPage2Variant && (
                      <span className="text-xl text-muted-foreground line-through font-normal">
                        {premiumPrice.formatted}
                      </span>
                    )}
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
                  {isLoadingPacks ? t("buyCredits.loading") : loadingPackId !== null && loadingPackId === proPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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
                  <p className="text-sm text-muted-foreground">
                    {isPage2Variant ? `${premiumCredits} ${t("buyCredits.photos") || "photos"}` : t("buyCredits.premiumCredits")}
                  </p>
                  <div className={`text-4xl font-bold text-primary mt-4 ${isPage2Variant && premiumPrice.oldFormatted ? "flex items-center justify-center gap-2" : ""}`}>
                    <span>{premiumPrice.formatted}</span>
                    {isPage2Variant && premiumPrice.oldFormatted && (
                      <span className="text-xl text-muted-foreground line-through font-normal">
                        {premiumPrice.oldFormatted}
                      </span>
                    )}
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
                  {isLoadingPacks ? t("buyCredits.loading") : loadingPackId !== null && loadingPackId === premiumPackId ? t("buyCredits.loading") : t("buyCredits.buy")}
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

