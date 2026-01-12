// Currency localization utilities
import { trpcVanilla } from "@/lib/trpc";

export type Currency = "USD" | "EUR";

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("[Currency] Could not read from localStorage:", e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("[Currency] Could not write to localStorage:", e);
    }
  },
};

// Detect user's currency - always returns USD
export function detectCurrency(): Currency {
  // Always use USD for all pricing
  return "USD";
}

// Set user's preferred currency and save it
export function setPreferredCurrency(currency: Currency): void {
  safeLocalStorage.setItem("preferredCurrency", currency);
}

// Pricing cache to avoid excessive database queries
let pricingCache: Map<string, {
  price: number;
  oldPrice?: number;
  credits?: number;
  timestamp: number;
}> = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to detect active variant
function detectActiveVariant(): 'page1' | 'page2' | 'page3' | 'page4' | 'page5' {
  if (typeof window === "undefined") return 'page2';
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get("variant") as 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | null;
    const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | null;
    const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | null;
    
    // Return the first found variant, default to page2
    return urlVariant || cachedVariant || firstVariant || 'page2';
  } catch (e) {
    return 'page2';
  }
}

// Helper to get pricing from database with caching and timeout
// Always uses USD currency
async function getPricingFromDB(
  packKey: string,
  variant: 'page1' | 'page2' | 'page3' | 'page4' | 'page5',
  currency: Currency = "USD"
): Promise<{ price: number; oldPrice?: number; credits?: number } | null> {
  // Force USD for all pricing
  const usdCurrency: Currency = "USD";
  const cacheKey = `${packKey}-${variant}-${usdCurrency}`;
  const cached = pricingCache.get(cacheKey);
  
  // Return cached value if still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { price: cached.price, oldPrice: cached.oldPrice, credits: cached.credits };
  }
  
  try {
    // Add timeout to prevent hanging (5 seconds)
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });
    
    const pricingPromise = trpcVanilla.pricing.getVariantPricing.query({ packKey, variant, currency: usdCurrency });
    
    const result = await Promise.race([pricingPromise, timeoutPromise]);
    
    // Handle null response (no pricing found)
    if (result === null) {
      return null;
    }
    
    // Handle valid pricing result
    if (result && typeof result === 'object' && 'price' in result) {
      const pricing = result as { price: number; oldPrice?: number; credits?: number };
      
      // Ensure all values are numbers
      const priceValue = typeof pricing.price === 'number' ? pricing.price : Number(pricing.price) || 0;
      const oldPriceValue = pricing.oldPrice !== undefined 
        ? (typeof pricing.oldPrice === 'number' ? pricing.oldPrice : Number(pricing.oldPrice))
        : undefined;
      const creditsValue = pricing.credits !== undefined
        ? (typeof pricing.credits === 'number' ? pricing.credits : Number(pricing.credits))
        : undefined;
      
      pricingCache.set(cacheKey, {
        price: priceValue,
        oldPrice: oldPriceValue,
        credits: creditsValue,
        timestamp: Date.now(),
      });
      
      return { 
        price: priceValue, 
        oldPrice: oldPriceValue, 
        credits: creditsValue
      };
    }
  } catch (error: any) {
    // Log error but don't throw - fallback to hardcoded prices
    console.error('[Currency] Error fetching pricing from DB:', error?.message || error);
  }
  
  return null;
}

// Fallback prices in case database is unavailable (USD cents)
// All with 70% discount: oldPrice = Math.ceil((price / 0.3) / 100) * 100 (arredondado para cima para número inteiro)
const FALLBACK_PRICES = {
  page1: {
    starter: { price: 500, oldPrice: 1700 },    // $5 (era $17.00 - 70% desconto, arredondado para cima)
    pro: { price: 700, oldPrice: 2400 },        // $7 (era $24.00 - 70% desconto, arredondado para cima)
    premium: { price: 1500, oldPrice: 5000 },  // $15 (era $50.00 - 70% desconto)
    business: { price: 1500, oldPrice: 5000 },
  },
  page2: {
    basic: { price: 500, oldPrice: 1700, credits: 40 },    // $5 (era $17.00, arredondado para cima)
    standard: { price: 700, oldPrice: 2400, credits: 60 }, // $7 (era $24.00, arredondado para cima)
    premium: { price: 1500, oldPrice: 5000, credits: 100 }, // $15 (era $50.00)
  },
  page3: {
    basic: { price: 1200, oldPrice: 4000, credits: 40 },    // $12 (era $40.00)
    standard: { price: 1500, oldPrice: 5000, credits: 60 }, // $15 (era $50.00)
    premium: { price: 2500, oldPrice: 8400, credits: 100 }, // $25 (era $84.00, arredondado para cima)
  },
  page4: {
    basic: { price: 2900, oldPrice: 9700, credits: 40 },    // $29 (era $97.00, arredondado para cima)
    standard: { price: 3900, oldPrice: 13000, credits: 60 }, // $39 (era $130.00)
    premium: { price: 5900, oldPrice: 19700, credits: 100 }, // $59 (era $197.00, arredondado para cima)
  },
  page5: {
    basic: { price: 3500, oldPrice: 11700, credits: 40 },   // $35 (era $117.00, arredondado para cima)
    standard: { price: 4500, oldPrice: 15000, credits: 60 }, // $45 (era $150.00)
    premium: { price: 7500, oldPrice: 25000, credits: 100 }, // $75 (era $250.00)
  },
};

// Export legacy constants for backward compatibility
// Note: These are fallback values - the app now fetches prices from the database
export const BASE_PRICES = {
  starter: FALLBACK_PRICES.page1.starter.price,
  pro: FALLBACK_PRICES.page1.pro.price,
  premium: FALLBACK_PRICES.page1.premium.price,
  business: FALLBACK_PRICES.page1.business.price,
};

export const BASE_OLD_PRICES = {
  starter: FALLBACK_PRICES.page1.starter.oldPrice,
  pro: FALLBACK_PRICES.page1.pro.oldPrice,
  premium: FALLBACK_PRICES.page1.premium.oldPrice,
};

export const PAGE2_PRICES = {
  basic: FALLBACK_PRICES.page2.basic.price,
  standard: FALLBACK_PRICES.page2.standard.price,
  premium: FALLBACK_PRICES.page2.premium.price,
};

export const PAGE2_OLD_PRICES = {
  basic: FALLBACK_PRICES.page2.basic.oldPrice,
  standard: FALLBACK_PRICES.page2.standard.oldPrice,
  premium: FALLBACK_PRICES.page2.premium.oldPrice,
};

export const PAGE2_CREDITS = {
  basic: FALLBACK_PRICES.page2.basic.credits!,
  standard: FALLBACK_PRICES.page2.standard.credits!,
  premium: FALLBACK_PRICES.page2.premium.credits!,
};

// Synchronous version that uses fallback prices immediately (for initial render)
export function getPage2PriceSync(
  plan: "basic" | "standard" | "premium",
  variant: 'page2' | 'page3' | 'page4' | 'page5' = 'page2'
): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
} {
  const usdCurrency: Currency = "USD";
  // Use correct variant pricing (defaults to page2 if variant not found)
  // Only page2-page5 have the correct structure with basic/standard/premium
  let variantPrices: typeof FALLBACK_PRICES.page2;
  if (variant === 'page2' || variant === 'page3' || variant === 'page4' || variant === 'page5') {
    variantPrices = FALLBACK_PRICES[variant] as typeof FALLBACK_PRICES.page2;
  } else {
    variantPrices = FALLBACK_PRICES.page2;
  }
  const fallback = variantPrices[plan] as { price: number; oldPrice?: number; credits?: number };
  const price = fallback.price;
  const oldPrice = fallback.oldPrice;
  const credits = fallback.credits;
  const shouldShowOldPrice = oldPrice && oldPrice !== price;
  
  return {
    amount: price,
    formatted: formatPrice(price, usdCurrency),
    oldAmount: shouldShowOldPrice ? oldPrice : undefined,
    oldFormatted: shouldShowOldPrice && oldPrice ? formatPrice(oldPrice, usdCurrency) : undefined,
    currency: usdCurrency,
    credits,
  };
}

// Get localized price for page2 plan - SYNC, uses fallback immediately
export function getPage2Price(plan: "basic" | "standard" | "premium", currency?: Currency): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
} {
  return getPage2PriceSync(plan);
}


// Convert price from USD cents to target currency cents
export function convertPrice(usdCents: number, currency: Currency): number {
  // Use same numeric value for EUR as USD (no conversion)
  return usdCents;
}

// Format price for display - always uses USD
export function formatPrice(cents: number, currency: Currency = "USD"): string {
  const amount = cents / 100;
  
  // Always format as USD
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get currency symbol - always returns USD symbol
export function getCurrencySymbol(currency: Currency = "USD"): string {
  return "$";
}

// Detect active variant and map to correct pricing variant
function getPricingVariant(isPage2?: boolean): 'page2' | 'page3' | 'page4' | 'page5' {
  if (!isPage2) return 'page2'; // Default to page2 for isPage2=false
  
  // Detect which variant (page2, page3, page4, page5) is active
  const activeVariant = detectActiveVariant();
  
  // Only use variants page2-page5 if they match, otherwise default to page2
  if (activeVariant === 'page2' || activeVariant === 'page3' || activeVariant === 'page4' || activeVariant === 'page5') {
    return activeVariant;
  }
  
  return 'page2'; // Default fallback
}

// Synchronous version that uses fallback prices immediately (for initial render)
export function getLocalizedPriceSync(pack: "starter" | "pro" | "premium" | "business", isPage2?: boolean): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
} {
  const usdCurrency: Currency = "USD";
  
  // For page2 variant, use page2 prices (all variants page2-page5 use page2 structure)
  if (isPage2 && pack !== "business") {
    // Only process if pack is starter, pro, or premium (not business)
    if (pack === "starter" || pack === "pro" || pack === "premium") {
      const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
        starter: "basic",
        pro: "standard",
        premium: "premium",
      };
      const page2Pack: "basic" | "standard" | "premium" = page2PackMap[pack];
      // Detect variant to use correct fallback prices
      const variant = getPricingVariant(isPage2);
      return getPage2PriceSync(page2Pack, variant);
    }
  }
  
  // Use fallback prices for page1
  const fallback = FALLBACK_PRICES.page1[pack];
  const price = fallback.price;
  const oldPrice = fallback.oldPrice;
  const shouldShowOldPrice = oldPrice && oldPrice !== price;
  
  return {
    amount: price,
    formatted: formatPrice(price, usdCurrency),
    oldAmount: shouldShowOldPrice ? oldPrice : undefined,
    oldFormatted: shouldShowOldPrice && oldPrice ? formatPrice(oldPrice, usdCurrency) : undefined,
    currency: usdCurrency,
  };
}

// Get localized price for a pack - SYNC, uses fallback immediately
export function getLocalizedPrice(pack: "starter" | "pro" | "premium" | "business", currency?: Currency, isPage2?: boolean): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
} {
  return getLocalizedPriceSync(pack, isPage2);
}

// Async fetcher for page1/page2 price (optional usage)
export async function fetchLocalizedPrice(pack: "starter" | "pro" | "premium" | "business", isPage2?: boolean): Promise<{
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
}> {
  const usdCurrency: Currency = "USD";
  if (isPage2 && pack !== "business") {
    // Only process if pack is starter, pro, or premium (not business)
    if (pack === "starter" || pack === "pro" || pack === "premium") {
      const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
        starter: "basic",
        pro: "standard",
        premium: "premium",
      };
      const page2Pack: "basic" | "standard" | "premium" = page2PackMap[pack];
      // Detect variant to fetch correct pricing
      const variant = getPricingVariant(isPage2);
      return fetchPage2Price(page2Pack, variant);
    }
  }
  
  // For page1, use page1 variant
  const dbPricing = await getPricingFromDB(pack, 'page1', usdCurrency);
  if (!dbPricing) {
    return getLocalizedPriceSync(pack, isPage2);
  }
  const shouldShowOldPrice = dbPricing.oldPrice && dbPricing.oldPrice !== dbPricing.price;
  return {
    amount: dbPricing.price,
    formatted: formatPrice(dbPricing.price, usdCurrency),
    oldAmount: shouldShowOldPrice ? dbPricing.oldPrice : undefined,
    oldFormatted: shouldShowOldPrice && dbPricing.oldPrice ? formatPrice(dbPricing.oldPrice, usdCurrency) : undefined,
    currency: usdCurrency,
  };
}

// Get credits/photos count for page2 packs - SYNC
export function getPage2Credits(pack: "starter" | "pro" | "premium", currency?: Currency): number {
  // Only process if pack is starter, pro, or premium
  if (pack === "starter" || pack === "pro" || pack === "premium") {
    const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
      starter: "basic",
      pro: "standard",
      premium: "premium",
    };
    const page2Pack: "basic" | "standard" | "premium" = page2PackMap[pack];
    // Detect variant to use correct fallback prices
    const variant = getPricingVariant(true);
    let variantPrices: typeof FALLBACK_PRICES.page2;
    if (variant === 'page2' || variant === 'page3' || variant === 'page4' || variant === 'page5') {
      variantPrices = FALLBACK_PRICES[variant] as typeof FALLBACK_PRICES.page2;
    } else {
      variantPrices = FALLBACK_PRICES.page2;
    }
    return variantPrices[page2Pack]?.credits || 0;
  }
  return 0;
}

// Async fetcher for page2 price (optional usage)
export async function fetchPage2Price(
  plan: "basic" | "standard" | "premium",
  variant: 'page2' | 'page3' | 'page4' | 'page5' = 'page2'
): Promise<{
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
  credits?: number;
}> {
  const usdCurrency: Currency = "USD";
  const dbPricing = await getPricingFromDB(plan, variant, usdCurrency);
  
  if (dbPricing) {
    const shouldShowOldPrice = dbPricing.oldPrice && dbPricing.oldPrice !== dbPricing.price;
    return {
      amount: dbPricing.price,
      formatted: formatPrice(dbPricing.price, usdCurrency),
      oldAmount: shouldShowOldPrice ? dbPricing.oldPrice : undefined,
      oldFormatted: shouldShowOldPrice && dbPricing.oldPrice ? formatPrice(dbPricing.oldPrice, usdCurrency) : undefined,
      currency: usdCurrency,
      credits: dbPricing.credits,
    };
  }
  
  // Fallback to sync prices
  return getPage2PriceSync(plan, variant);
}

// Async fetcher for credits (optional usage)
export async function fetchPage2Credits(pack: "starter" | "pro" | "premium"): Promise<number> {
  // Only process if pack is starter, pro, or premium
  if (pack === "starter" || pack === "pro" || pack === "premium") {
    const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
      starter: "basic",
      pro: "standard",
      premium: "premium",
    };
    const page2Pack: "basic" | "standard" | "premium" = page2PackMap[pack];
    const usdCurrency: Currency = "USD";
    
    // Detect variant to fetch correct pricing
    const variant = getPricingVariant(true);
    const dbPricing = await getPricingFromDB(page2Pack, variant, usdCurrency);
    
    if (dbPricing && dbPricing.credits) {
      return dbPricing.credits;
    }
    
    // Use correct variant fallback (defaults to page2)
    // Only page2-page5 have the correct structure with basic/standard/premium
    let variantPrices: typeof FALLBACK_PRICES.page2;
    if (variant === 'page2' || variant === 'page3' || variant === 'page4' || variant === 'page5') {
      variantPrices = FALLBACK_PRICES[variant] as typeof FALLBACK_PRICES.page2;
    } else {
      variantPrices = FALLBACK_PRICES.page2;
    }
    return variantPrices[page2Pack]?.credits || 0;
  }
  return 0;
}


