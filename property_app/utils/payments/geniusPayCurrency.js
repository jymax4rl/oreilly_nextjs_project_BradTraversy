/**
 * Shared GeniusPay currency / rail helpers (safe for client + server).
 * Charge currencies on create-payment: XOF, EUR, USD.
 */

export const GENIUSPAY_CHARGE_CURRENCIES = new Set(["XOF", "EUR", "USD"]);

/** Currencies that stay on the African MoMo hosted checkout rail. */
export const AFRICAN_MOMO_CURRENCIES = new Set([
  "XOF",
  "XAF",
  "GHS",
  "KES",
  "NGN",
  "ZAR",
  "UGX",
  "RWF",
  "ZMW",
  "GMD",
  "MAD",
  "CDF",
  "SLE",
]);

export function normalizeGeniusPayCurrency(code) {
  return String(code || "USD").trim().toUpperCase() || "USD";
}

export function isGeniusPayAfricanCurrency(code) {
  return AFRICAN_MOMO_CURRENCIES.has(normalizeGeniusPayCurrency(code));
}

/**
 * Map the guest currency selector to a GeniusPay charge plan.
 * - African MoMo currencies → XOF hosted checkout (Wave / Orange / MTN)
 * - Non-African currencies → GeniusPay cannot present EUR/USD on this
 *   merchant (Paystack converts to XOF). Callers should use Creem instead;
 *   this plan marks rail=international so the UI can hide GeniusPay.
 */
export function resolveGeniusPayCheckoutPlan(selectedCurrency) {
  const selected = normalizeGeniusPayCurrency(selectedCurrency);

  if (isGeniusPayAfricanCurrency(selected)) {
    return {
      selectedCurrency: selected,
      chargeCurrency: "XOF",
      rail: "africa",
      /** Hosted MoMo checkout — amount must be a whole XOF integer */
      paymentMethod: null,
      allowedMethods: null,
      useGeniusPay: true,
    };
  }

  const chargeCurrency = selected === "EUR" ? "EUR" : "USD";
  return {
    selectedCurrency: selected,
    chargeCurrency,
    rail: "international",
    paymentMethod: null,
    allowedMethods: null,
    /** Prefer Creem for international — GeniusPay/Paystack is XOF-only here */
    useGeniusPay: false,
  };
}
