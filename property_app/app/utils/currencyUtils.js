// src/utils/currencyUtils.js

// Static metadata: Codes, Names, Symbols.
// We initialize rates to 1 (USD) as a fallback.
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 1 },
  { code: "ZAR", name: "South African Rand", symbol: "R", rate: 1 },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", rate: 1 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 1 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rate: 1 },
  { code: "MAD", name: "Moroccan Dirham", symbol: "DH", rate: 1 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", rate: 1 },
  { code: "XOF", name: "West African CFA Franc", symbol: "XOF", rate: 1 },
  { code: "XPF", name: "Comoros Franc", symbol: "XPF", rate: 1 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", rate: 1 },
  { code: "GMD", name: "Gambian Dalasi", symbol: "GMD", rate: 1 },
];

/**
 * Fetches live exchange rates from the Frankfurter API (Base: USD)
 * @returns {Promise<Object>} A map of currency codes to rates
 */
export const fetchExchangeRates = async () => {
  try {
    // Fetch rates with USD as the base currency
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();

    // The API returns an object like { rates: { EUR: 0.92, ZAR: 18.5, ... } }
    // We add USD: 1 manually since the API excludes the base currency
    return { ...data.rates, USD: 1 };
  } catch (error) {
    console.error("Failed to fetch rates:", error);
    return null; // Return null so the app can use fallbacks
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
