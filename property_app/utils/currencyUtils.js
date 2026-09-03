// Static metadata: Codes, Names, Symbols.
// We initialize rates to 1 (USD) as a fallback.
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 1 },
  { code: "ZAR", name: "South African Rand", symbol: "R", rate: 1 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 1 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rate: 1 },
  { code: "MAD", name: "Moroccan Dirham", symbol: "DH", rate: 1 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", rate: 1 },
  { code: "XOF", name: " West African CFA", symbol: "CFA/XOF", rate: 1 },
  {
    code: "XAF",
    name: " Central African CFA",
    symbol: "CFA/XAF",
    rate: 1,
  },
  { code: "XPF", name: "Comoros Franc", symbol: "XPF", rate: 1 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", rate: 1 },
  { code: "GMD", name: "Gambian Dalasi", symbol: "GMD", rate: 1 },
];

/**
 * Fetches live exchange rates from the CurrencyFreaks API (Base: USD)
 * @returns {Promise<Object>} A map of currency codes to rates
 */
export const fetchExchangeRates = async () => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API;

    // 1. CHECK FIRST: If key is missing, go straight to fallback
    const currencyApi = "https://open.er-api.com/v6/latest/USD";
    const res = await fetch(currencyApi);
    const data = await res.json();
    const liveRates =
      data && typeof data.rates === "object" && data.rates ? data.rates : {};
    if (!apiKey) {
      console.warn("API Key is missing! Using open fallback API.");
      return { ...liveRates, USD: 1 };
    }

    return { ...liveRates, USD: 1 };
  } catch (error) {
    // 4. ULTIMATE FALLBACK: If Primary API crashes or key is invalid
    console.error("Primary API failed, trying fallback...", error);

    try {
      // 5. Fallback: Use Open Exchange Rates API
      const fallbackRes = await fetch("https://open.er-api.com/v6/latest/USD");
      const fallbackData = await fallbackRes.json();
      return { ...fallbackData.rates, USD: 1 };
    } catch (e) {
      return { USD: 1 };
    }
  }
};

export function currencySymbol(code) {
  const normalized = String(code || "USD").trim().toUpperCase();
  return normalized === "USD" ? "$" : normalized;
}

/**
 * Listing rates are USD. Convert only when a live FX rate exists.
 * Missing/invalid rates stay on USD so SSR and crawlers never render "NaN".
 */
export function resolveFxRate(rates, currencyCode) {
  const code = String(currencyCode || "USD").trim().toUpperCase() || "USD";
  if (code === "USD") {
    return { currencyCode: "USD", rate: 1, symbol: "$" };
  }
  const raw = rates?.[code];
  const rate = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(rate) && rate > 0) {
    return { currencyCode: code, rate, symbol: currencySymbol(code) };
  }
  return { currencyCode: "USD", rate: 1, symbol: "$" };
}

export function formatListingPrice(amount, rates, currencyCode) {
  const fx = resolveFxRate(rates, currencyCode);
  return formatCurrency(amount, fx.rate, fx.symbol);
}

// 6. Format currency with fallback
export const formatCurrency = (amount, rate, symbol) => {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  const fx = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : 1;
  const converted = n * fx;
  if (!Number.isFinite(converted)) return "N/A";
  const safeSymbol = symbol || "$";

  return `${safeSymbol} ${converted.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};
