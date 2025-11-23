// Currency localization utilities

export type Currency = "USD" | "EUR";

// European countries that should use EUR
const EUROPEAN_COUNTRIES = [
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SK", "SI"
];

// Detect user's currency based on their location
export function detectCurrency(): Currency {
  // Try to get from browser's locale
  if (typeof window !== "undefined") {
    // Check timezone (rough indicator)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check if timezone suggests Europe
    if (timezone.startsWith("Europe/")) {
      return "EUR";
    }
    
    // Try to get country from locale
    const locale = navigator.language || (navigator as any).userLanguage;
    const countryCode = locale.split("-")[1]?.toUpperCase();
    
    if (countryCode && EUROPEAN_COUNTRIES.includes(countryCode)) {
      return "EUR";
    }
  }
  
  // Default to USD
  return "USD";
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
export function getLocalizedPrice(pack: "starter" | "pro" | "premium" | "business", currency?: Currency): {
  amount: number;
  formatted: string;
  currency: Currency;
} {
  const detectedCurrency = currency || detectCurrency();
  const basePrice = BASE_PRICES[pack];
  const convertedPrice = convertPrice(basePrice, detectedCurrency);
  
  return {
    amount: convertedPrice,
    formatted: formatPrice(convertedPrice, detectedCurrency),
    currency: detectedCurrency,
  };
}

