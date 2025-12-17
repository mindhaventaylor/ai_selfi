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
import { Check, Box, Star, Zap, Plus, CreditCard, Settings, HelpCircle, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/localStorage";
import { detectCurrency, getLocalizedPrice, getPage2Credits } from "@/utils/currency";

export default function BuyCredits() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [loadingPackId, setLoadingPackId] = useState<number | null>(null);
  const [mappedPackIds, setMappedPackIds] = useState<{
    starter: number | null;
    pro: number | null;
    premium: number | null;
  }>({ starter: null, pro: null, premium: null });
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
  
  // Removed console.log statements for production

  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();
  const { data: packs, isLoading: isLoadingPacks, error: packsError } = trpc.payment.listPacks.useQuery();

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
      
      const result = await createCheckoutMutation.mutateAsync({ 
        packId,
        currency: currency,
      });
      
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
  // For page1: Starter = $5, Pro = $10, Premium = $15
  // For page2: Starter = $5, Pro = $10, Premium = $15
  const getPackIdByBasePrice = (basePriceUSD: number): number | null => {
    if (!packs || packs.length === 0) {
      console.warn("[BuyCredits] No packs available for price matching:", basePriceUSD);
      return null;
    }
    
    // Find pack with matching base USD price (convert to cents for comparison)
    // Packs in database should have base USD prices
    // Use a small tolerance (1 cent) to handle floating point precision issues
    const targetCents = Math.round(basePriceUSD * 100);
    
    const pack = packs.find(p => {
      const packPrice = parseFloat(p.price.toString());
      const packCents = Math.round(packPrice * 100);
      const match = Math.abs(packCents - targetCents) <= 1; // Allow 1 cent tolerance
      
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

  // Use useEffect to calculate and store mapped pack IDs
  // This ensures the mapping happens AFTER packs are loaded and is reactive
  useEffect(() => {
    if (!packs || packs.length === 0) {
      setMappedPackIds({ starter: null, pro: null, premium: null });
      return;
    }

    // Helper function to find pack by price AND credits (defined inside useEffect to avoid closure issues)
    const findPackByPriceAndCredits = (basePriceUSD: number, expectedCredits: number): number | null => {
      if (!packs || packs.length === 0) return null;
      const targetCents = Math.round(basePriceUSD * 100);
      
      // First try exact match (price AND credits)
      let pack = packs.find(p => {
        const packPrice = parseFloat(p.price.toString());
        const packCents = Math.round(packPrice * 100);
        const priceMatch = Math.abs(packCents - targetCents) <= 1; // Allow 1 cent tolerance
        const creditsMatch = p.credits === expectedCredits;
        return priceMatch && creditsMatch;
      });
      
      if (pack) {
        return pack.id;
      }
      
      // If no exact match, try price only (fallback)
      pack = packs.find(p => {
        const packPrice = parseFloat(p.price.toString());
        const packCents = Math.round(packPrice * 100);
        return Math.abs(packCents - targetCents) <= 1; // Allow 1 cent tolerance
      });
      
      return pack?.id || null;
    };

    // Expected credits for each plan
    const expectedStarterCredits = isPage2Variant ? 40 : 40;
    const expectedProCredits = isPage2Variant ? 60 : 100;
    const expectedPremiumCredits = isPage2Variant ? 100 : 150;

    // Try to find packs by price AND credits first
    // All variations use same prices: $5, $10, $15
    let mappedStarter = findPackByPriceAndCredits(5, expectedStarterCredits);
    let mappedPro = findPackByPriceAndCredits(10, expectedProCredits);
    let mappedPremium = findPackByPriceAndCredits(15, expectedPremiumCredits);
    
    const needsFallback = !mappedStarter || !mappedPro || !mappedPremium;
    // For page2 variant, ALWAYS use fallback mapping regardless of price match
    const shouldUseFallback = isPage2Variant ? true : needsFallback;
    
    if (shouldUseFallback) {
      console.warn("[BuyCredits] ⚠️ Using FALLBACK mapping by order (prices don't match or page2 variant)");
      const sortedPacks = [...packs].sort((a, b) => {
        const priceA = parseFloat(a.price.toString());
        const priceB = parseFloat(b.price.toString());
        return priceA - priceB;
      });
      
      if (isPage2Variant) {
        // Page2: ALWAYS map packs to starter, pro, premium based on order AND credits when possible
        
        // Try to match by credits first, then by order
        const matchByCredits = (expectedCredits: number, planName: string): number | null => {
          const match = sortedPacks.find(p => p.credits === expectedCredits);
          if (match) {
            return match.id;
          }
          return null;
        };
        
        // Try to match starter by credits (40) - ONLY exact match or use order
        if (!mappedStarter) {
          const creditsMatch = matchByCredits(expectedStarterCredits, "STARTER");
          mappedStarter = creditsMatch;
          if (!mappedStarter && sortedPacks.length >= 1) {
            // Use first pack by order if no exact match
            mappedStarter = sortedPacks[0].id;
          }
        }
        
        // Try to match pro by credits (60) - ONLY exact match or use order
        if (!mappedPro) {
          const creditsMatch = matchByCredits(expectedProCredits, "PRO");
          mappedPro = creditsMatch;
          if (!mappedPro) {
            // Use second pack by order if no exact match, excluding already mapped packs
            const availablePacks = sortedPacks.filter(p => p.id !== mappedStarter);
            if (availablePacks.length >= 1) {
              mappedPro = availablePacks[0].id;
            } else if (sortedPacks.length >= 2) {
              mappedPro = sortedPacks[1].id;
            }
          }
          // If only 2 packs, also use second as premium
          if (sortedPacks.length === 2 && !mappedPremium) {
            mappedPremium = sortedPacks[1].id;
          }
        }
        
        // Try to match premium by credits (100) - ONLY exact match or use order
        if (!mappedPremium && sortedPacks.length >= 2) {
          const creditsMatch = matchByCredits(expectedPremiumCredits, "PREMIUM");
          mappedPremium = creditsMatch;
          if (!mappedPremium) {
            // Use third pack by order if no exact match, excluding already mapped packs
            const availablePacks = sortedPacks.filter(p => p.id !== mappedStarter && p.id !== mappedPro);
            if (availablePacks.length >= 1) {
              mappedPremium = availablePacks[0].id;
            } else if (sortedPacks.length >= 3) {
              // Fallback to third pack if available
              mappedPremium = sortedPacks[2].id;
            }
          }
        }
      } else {
        // Page1: Map by credits first (EXACT match only), then by order if not found by price
        const matchByCredits = (expectedCredits: number, planName: string): number | null => {
          const match = sortedPacks.find(p => p.credits === expectedCredits);
          if (match) {
            return match.id;
          }
          return null;
        };
        
        // STARTER: Try exact match first, then use first pack by order
        if (!mappedStarter && sortedPacks.length >= 1) {
          const creditsMatch = matchByCredits(expectedStarterCredits, "STARTER");
          mappedStarter = creditsMatch || sortedPacks[0].id;
          if (!creditsMatch) {
          }
        }
        
        // PRO: Try exact match first, then use second pack by order
        if (!mappedPro && sortedPacks.length >= 2) {
          const creditsMatch = matchByCredits(expectedProCredits, "PRO");
          mappedPro = creditsMatch || sortedPacks[1].id;
          if (!creditsMatch) {
          }
        }
        
        // PREMIUM: Try exact match first, then use third pack by order
        if (!mappedPremium) {
          const creditsMatch = matchByCredits(expectedPremiumCredits, "PREMIUM");
          if (creditsMatch) {
            mappedPremium = creditsMatch;
          } else if (sortedPacks.length >= 3) {
            mappedPremium = sortedPacks[2].id;
          } else if (sortedPacks.length === 2) {
            // If only 2 packs, use second as premium too
            mappedPremium = sortedPacks[1].id;
          }
        }
      }
    } else {
    }
    
    // Update state with mapped pack IDs
    setMappedPackIds({
      starter: mappedStarter,
      pro: mappedPro,
      premium: mappedPremium
    });
  }, [packs, isPage2Variant]);

  // Use mapped pack IDs from state
  const starterPackId = mappedPackIds.starter;
  const proPackId = mappedPackIds.pro;
  const premiumPackId = mappedPackIds.premium;

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
      
      if (targetPackId) {
        autoBuyRef.current = true;
        // Small delay to ensure UI is ready
        const timer = setTimeout(async () => {
          try {
            setLoadingPackId(targetPackId);
            
            const result = await createCheckoutMutation.mutateAsync({ 
              packId: targetPackId,
              currency: currency,
            });
            
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

  // Debug: log packs with detailed information (AFTER fallback mapping)
  useEffect(() => {
    if (!packs || packs.length === 0) {
      if (!isLoadingPacks) {
        console.warn("⚠️ [BuyCredits] No packs found in database after loading completed");
      }
    }
  }, [packs, isPage2Variant, planParam, starterPackId, proPackId, premiumPackId, isLoadingPacks]);

  return (
    <div className="min-h-screen bg-background">
      <div className={`max-w-7xl mx-auto px-6 py-8 ${isMobile ? "pb-20" : ""}`}>
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
                  <div className={`text-4xl font-bold text-primary mt-4 ${starterPrice.oldFormatted ? "flex items-center justify-center gap-2" : ""}`}>
                    <span>{starterPrice.formatted}</span>
                    {starterPrice.oldFormatted && (
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

                {/* Buy Button - No credit check, anyone can buy */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={() => handleBuyClick(starterPackId)}
                  disabled={isLoadingPacks || !starterPackId || loadingPackId === starterPackId}
                  title={!starterPackId ? (t("buyCredits.packNotFound") || "Pack not available. Please try again later.") : undefined}
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
                    {proPrice.oldFormatted && (
                      <span className="text-xl text-muted-foreground line-through font-normal">
                        {proPrice.oldFormatted}
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

                {/* Buy Button - No credit check, anyone can buy */}
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={() => handleBuyClick(proPackId)}
                  disabled={isLoadingPacks || !proPackId || loadingPackId === proPackId}
                  title={!proPackId ? (t("buyCredits.packNotFound") || "Pack not available. Please try again later.") : undefined}
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
                  <div className={`text-4xl font-bold text-primary mt-4 ${premiumPrice.oldFormatted ? "flex items-center justify-center gap-2" : ""}`}>
                    <span>{premiumPrice.formatted}</span>
                    {premiumPrice.oldFormatted && (
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

                {/* Buy Button - No credit check, anyone can buy */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={() => handleBuyClick(premiumPackId)}
                  disabled={isLoadingPacks || !premiumPackId || loadingPackId === premiumPackId}
                  title={!premiumPackId ? (t("buyCredits.packNotFound") || "Pack not available. Please try again later.") : undefined}
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

      {/* Bottom Navigation Bar - Mobile Only (Hidden for page1 variant) */}
      {isMobile && isPage2Variant && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation("/dashboard/start")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Start Here"
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation("/dashboard/gallery")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Gallery"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gallery</span>
              </button>

              {/* Create - Centered, Prominent Button */}
              <button
                onClick={() => setLocation(isPage2Variant ? "/dashboard/generate?variant=page2" : "/dashboard/generate")}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                aria-label="Create"
              >
                <Plus className="h-7 w-7" />
              </button>

              {/* Buy Credits */}
              <button
                onClick={() => setLocation("/dashboard/credits/buy")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Buy Credits"
              >
                <CreditCard className="h-6 w-6 text-primary" />
                <span className="text-xs text-primary">Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation("/dashboard/settings/general")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


