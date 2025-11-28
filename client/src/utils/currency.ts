// Currency localization utilities

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

// European countries that should use EUR
const EUROPEAN_COUNTRIES = [
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SK", "SI"
];

// Languages that should use EUR
const EUR_LANGUAGES = ["it", "es"];

// Detect user's currency based on their location and language
export function detectCurrency(): Currency {
  // First, check if user has a saved preference
  if (typeof window !== "undefined") {
    const savedCurrency = safeLocalStorage.getItem("preferredCurrency") as Currency | null;
    if (savedCurrency === "USD" || savedCurrency === "EUR") {
      return savedCurrency;
    }

    // Check current language from i18n
    try {
      const currentLang = safeLocalStorage.getItem("i18nextLng");
      if (currentLang) {
        // Extract base language code (e.g., "it" from "it" or "es" from "es")
        const baseLang = currentLang.split("-")[0].toLowerCase();
        if (EUR_LANGUAGES.includes(baseLang)) {
          return "EUR";
        }
      }
    } catch (e) {
      console.warn("[Currency] Could not read language from localStorage:", e);
    }

    // Check browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      const baseLang = browserLang.split("-")[0].toLowerCase();
      if (EUR_LANGUAGES.includes(baseLang)) {
        return "EUR";
      }
    }

    // Check timezone (rough indicator)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check if timezone suggests Europe
    if (timezone.startsWith("Europe/")) {
      return "EUR";
    }
    
    // Try to get country from locale
    const countryCode = browserLang.split("-")[1]?.toUpperCase();
    
    if (countryCode && EUROPEAN_COUNTRIES.includes(countryCode)) {
      return "EUR";
    }
  }
  
  // Default to USD
  return "USD";
}

// Set user's preferred currency and save it
export function setPreferredCurrency(currency: Currency): void {
  safeLocalStorage.setItem("preferredCurrency", currency);
}

// Currency conversion rates (approximate, you may want to use a real API)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92, // Approximate EUR to USD rate
};

// Base prices in USD (cents)
export const BASE_PRICES = {
  starter: 2900, // $29.00
  pro: 3900, // $39.00
  premium: 4900, // $49.00
  business: 1500, // $15.00 per person
};

// Page2 flow price variations (USD cents) - buy credits prices
export const PAGE2_PRICES = {
  basic: 1800, // $18.00 (40 fotos)
  standard: 2500, // $25.00 (60 fotos)
  premium: 4000, // $40.00 (100 fotos)
};

// Page2 flow credits/photos count
export const PAGE2_CREDITS = {
  basic: 40, // 40 fotos
  standard: 60, // 60 fotos
  premium: 100, // 100 fotos
};

// Original prices before discount for page2 buy credits (USD cents)
export const PAGE2_OLD_PRICES = {
  basic: 2900, // $29.00 (original price for 40 photos)
  standard: 3900, // $39.00 (original price for 60 photos)
  premium: 4900, // $49.00 (original price for 100 photos)
};

// Get localized price for page2 plan
export function getPage2Price(plan: "basic" | "standard" | "premium", currency?: Currency): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
} {
  const detectedCurrency = currency || detectCurrency();
  const basePrice = PAGE2_PRICES[plan];
  const oldBasePrice = PAGE2_OLD_PRICES[plan];
  const convertedPrice = convertPrice(basePrice, detectedCurrency);
  const oldConvertedPrice = convertPrice(oldBasePrice, detectedCurrency);
  
  return {
    amount: convertedPrice,
    formatted: formatPrice(convertedPrice, detectedCurrency),
    oldAmount: oldConvertedPrice,
    oldFormatted: formatPrice(oldConvertedPrice, detectedCurrency),
    currency: detectedCurrency,
  };
}

// Convert price from USD cents to target currency cents
export function convertPrice(usdCents: number, currency: Currency): number {
  if (currency === "USD") {
    return usdCents;
  }
  
  // Convert to EUR (multiply by exchange rate)
  return Math.round(usdCents * EXCHANGE_RATES[currency]);
}

// Format price for display
export function formatPrice(cents: number, currency: Currency): string {
  const amount = cents / 100;
  
  return new Intl.NumberFormat(
    currency === "EUR" ? "de-DE" : "en-US",
    {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return currency === "EUR" ? "€" : "$";
}

// Get localized price for a pack
export function getLocalizedPrice(pack: "starter" | "pro" | "premium" | "business", currency?: Currency, isPage2?: boolean): {
  amount: number;
  formatted: string;
  oldAmount?: number;
  oldFormatted?: string;
  currency: Currency;
} {
  const detectedCurrency = currency || detectCurrency();
  
  // For page2 variant, use page2 prices with old prices for comparison
  if (isPage2) {
    const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
      starter: "basic",
      pro: "standard",
      premium: "premium",
    };
    const page2Pack = page2PackMap[pack];
    if (page2Pack) {
      const basePrice = PAGE2_PRICES[page2Pack];
      const oldBasePrice = PAGE2_OLD_PRICES[page2Pack];
      const convertedPrice = convertPrice(basePrice, detectedCurrency);
      const oldConvertedPrice = convertPrice(oldBasePrice, detectedCurrency);
      return {
        amount: convertedPrice,
        formatted: formatPrice(convertedPrice, detectedCurrency),
        oldAmount: oldConvertedPrice,
        oldFormatted: formatPrice(oldConvertedPrice, detectedCurrency),
        currency: detectedCurrency,
      };
    }
  }
  
  // Default prices for page1
  const basePrice = BASE_PRICES[pack];
  const convertedPrice = convertPrice(basePrice, detectedCurrency);
  
  return {
    amount: convertedPrice,
    formatted: formatPrice(convertedPrice, detectedCurrency),
    currency: detectedCurrency,
  };
}

// Get credits/photos count for page2 packs
export function getPage2Credits(pack: "starter" | "pro" | "premium"): number {
  const page2PackMap: Record<"starter" | "pro" | "premium", "basic" | "standard" | "premium"> = {
    starter: "basic",
    pro: "standard",
    premium: "premium",
  };
  const page2Pack = page2PackMap[pack];
  return PAGE2_CREDITS[page2Pack] || 0;
}

