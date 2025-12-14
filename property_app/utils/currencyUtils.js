// src/utils/currencyUtils.js

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
    if (!apiKey) {
      console.warn("API Key is missing! Using open fallback API.");
      const currencyApi = "https://open.er-api.com/v6/latest/USD";
      const res = await fetch(currencyApi);
      const data = await res.json();
      // Ensure we add the USD: 1 base, as open-er-api might exclude it
      return { ...data.rates, USD: 1 };
    }

    // 2. PRIMARY: If key exists, use CurrencyFreaks
    const res = await fetch(
      `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}`
    );

    // 3. Handle specific API errors (e.g., if key is invalid/expired)
    if (!res.ok) {
      throw new Error(`CurrencyFreaks API Error: ${res.status}`);
    }

    const data = await res.json();
    return { ...data.rates, USD: 1 };
  } catch (error) {
    // 4. ULTIMATE FALLBACK: If Primary API crashes or key is invalid
    console.error("Primary API failed, trying fallback...", error);
    try {
      const fallbackRes = await fetch("https://open.er-api.com/v6/latest/USD");
      const fallbackData = await fallbackRes.json();
      return { ...fallbackData.rates, USD: 1 };
    } catch (e) {
      return null; // Both failed
    }
  }
};

export const formatCurrency = (amount, rate, symbol) => {
  if (!amount) return "N/A";
  const converted = amount * rate;
  const safeSymbol = symbol || "$";

  return `${safeSymbol}${converted.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};
