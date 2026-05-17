/**
 * Flutterwave mobile-money support by currency.
 * Used to show Orange Money / regional mobile money reserve UX.
 */

export const MOBILE_MONEY_BY_CURRENCY = {
  XOF: {
    reserveLabel: "Reserve with Orange Money",
    hint: "Pay with Orange Money, MTN, or Moov",
    providers: ["Orange Money", "MTN", "Moov"],
    useOrangeBranding: true,
    flutterwavePaymentOption: "mobilemoneyfranco",
    country: "CI",
  },
  XAF: {
    reserveLabel: "Reserve with Orange Money",
    hint: "Pay with Orange Money or MTN Mobile Money",
    providers: ["Orange Money", "MTN"],
    useOrangeBranding: true,
    flutterwavePaymentOption: "mobilemoneyfranco",
    country: "CM",
  },
  GHS: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "MTN Mobile Money · Vodafone Cash",
    providers: ["MTN", "Vodafone"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoneyghana",
    country: "GH",
  },
  KES: {
    reserveLabel: "Reserve with M-Pesa",
    hint: "M-Pesa and other mobile wallets",
    providers: ["M-Pesa"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoney",
    country: "KE",
  },
  NGN: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "Bank transfer & mobile wallets",
    providers: ["Mobile Money"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoney",
    country: "NG",
  },
  ZAR: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "Supported mobile wallets",
    providers: ["Mobile Money"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoney",
    country: "ZA",
  },
  UGX: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "MTN Mobile Money & more",
    providers: ["MTN"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoneyuganda",
    country: "UG",
  },
  RWF: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "MTN MoMo & supported wallets",
    providers: ["MTN MoMo"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoneyrwanda",
    country: "RW",
  },
  ZMW: {
    reserveLabel: "Reserve with Mobile Money",
    hint: "Airtel Money & MTN",
    providers: ["Airtel", "MTN"],
    useOrangeBranding: false,
    flutterwavePaymentOption: "mobilemoneyzambia",
    country: "ZM",
  },
};

export function normalizeCurrencyCode(currencyCode) {
  return String(currencyCode || "")
    .trim()
    .toUpperCase();
}

export function getMobileMoneySupport(currencyCode) {
  const code = normalizeCurrencyCode(currencyCode);
  if (!code || code === "USD") return null;
  return MOBILE_MONEY_BY_CURRENCY[code] ?? null;
}

export function isMobileMoneyCurrency(currencyCode) {
  return Boolean(getMobileMoneySupport(currencyCode));
}

export function getFlutterwaveCountry(currencyCode) {
  return getMobileMoneySupport(currencyCode)?.country ?? "NG";
}

export function getFlutterwavePaymentOption(currencyCode) {
  const support = getMobileMoneySupport(currencyCode);
  if (support) return support.flutterwavePaymentOption;
  return "card,mobilemoney,ussd";
}
