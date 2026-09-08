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
 * - African MoMo currencies → XOF, hosted checkout (MoMo + card)
 * - EUR → charge EUR via payment_method=card (Stripe wallets/card)
 * - Other non-African → charge USD via payment_method=card
 *
 * Hosted GeniusPay checkout always presents XOF, so international must use
 * the direct card gateway to keep Apple Pay / Google Pay / card in EUR/USD.
 */
export function resolveGeniusPayCheckoutPlan(selectedCurrency) {
  const selected = normalizeGeniusPayCurrency(selectedCurrency);

  if (isGeniusPayAfricanCurrency(selected)) {
    return {
      selectedCurrency: selected,
      chargeCurrency: "XOF",
      rail: "africa",
      paymentMethod: null,
      allowedMethods: null,
    };
  }

  const chargeCurrency = selected === "EUR" ? "EUR" : "USD";
  return {
    selectedCurrency: selected,
    chargeCurrency,
    rail: "international",
    paymentMethod: "card",
    allowedMethods: null,
  };
}
