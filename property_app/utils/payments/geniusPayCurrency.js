/**
 * Shared GeniusPay currency / rail helpers (safe for client + server).
 *
 * This merchant settles through Paystack in XOF. Card and MoMo both charge
 * whole-number XOF — never send fractional EUR/USD (Paystack rejects decimals).
 */

export const GENIUSPAY_CHARGE_CURRENCIES = new Set(["XOF", "EUR", "USD"]);

/** Currencies that unlock the African MoMo checkout option. */
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
 * @param {string} selectedCurrency guest currency selector
 * @param {"momo"|"card"|null|undefined} intent
 *   - momo → hosted MoMo checkout (Africa)
 *   - card → payment_method=card (Visa/Mastercard via GeniusPay/Paystack)
 *   - omitted → infer from currency (Africa→momo, else→card)
 */
export function resolveGeniusPayCheckoutPlan(selectedCurrency, intent) {
  const selected = normalizeGeniusPayCurrency(selectedCurrency);
  const african = isGeniusPayAfricanCurrency(selected);
  const wantCard =
    intent === "card" ||
    intent === "geniuspay_card" ||
    (!intent && !african);
  const wantMomo = intent === "momo" || intent === "geniuspay" || (!intent && african);

  if (wantCard || (!wantMomo && !african)) {
    return {
      selectedCurrency: selected,
      /** Paystack settlement currency — must be a whole number */
      chargeCurrency: "XOF",
      rail: "international",
      paymentMethod: "card",
      allowedMethods: null,
      useGeniusPay: true,
      intent: "card",
    };
  }

  return {
    selectedCurrency: selected,
    chargeCurrency: "XOF",
    rail: "africa",
    paymentMethod: null,
    allowedMethods: null,
    useGeniusPay: true,
    intent: "momo",
  };
}
