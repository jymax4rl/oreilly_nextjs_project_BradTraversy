/**
 * GeniusPay merchant API client (Wave / Orange / MTN / Moov / card / wallets).
 * Docs: https://geniuspay.ci/docs/api
 * Base: https://geniuspay.ci/api/v1/merchant
 *
 * Charge currencies supported by GeniusPay create-payment: XOF, EUR, USD.
 * African MoMo selectors → XOF + full checkout.
 * Non-African selectors → EUR or USD + card/wallet rail (Apple Pay / Google Pay / card).
 */

const DEFAULT_BASE = "https://geniuspay.ci/api/v1/merchant";

/** GeniusPay create-payment accepts these charge currencies. */
export const GENIUSPAY_CHARGE_CURRENCIES = new Set(["XOF", "EUR", "USD"]);

/** Currencies that should stay on the African MoMo checkout rail. */
const AFRICAN_MOMO_CURRENCIES = new Set([
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

function assertLatin1Env(name, value) {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) {
      throw new Error(
        `${name} contains a non-Latin-1 character (often a pasted …). Re-save the key in Vercel with plain ASCII only.`,
      );
    }
  }
  return value;
}

/** Public key: pk_live_… / pk_sandbox_… */
export function getGeniusPayPublicKey() {
  const raw =
    process.env.GENIUSPAY_API_KEY ||
    process.env.GENIUSPAY_PUBLIC_KEY ||
    "";
  const key = String(raw).trim();
  if (!key) return "";
  return assertLatin1Env("GENIUSPAY_API_KEY", key);
}

/** Secret key: sk_live_… / sk_sandbox_… — server only */
export function getGeniusPaySecretKey() {
  const raw =
    process.env.GENIUSPAY_API_SECRET ||
    process.env.GENIUSPAY_SECRET_KEY ||
    "";
  const key = String(raw).trim();
  if (!key) return "";
  return assertLatin1Env("GENIUSPAY_API_SECRET", key);
}

export function getGeniusPayApiBase() {
  return String(process.env.GENIUSPAY_API_BASE || DEFAULT_BASE).replace(
    /\/$/,
    "",
  );
}

export function isGeniusPayConfigured() {
  return Boolean(getGeniusPayPublicKey() && getGeniusPaySecretKey());
}

function sanitizeMetaValue(value) {
  if (value == null) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return metadata;
  const out = {};
  for (const [k, v] of Object.entries(metadata)) {
    out[k] = sanitizeMetaValue(v);
  }
  return out;
}

/**
 * USD → XOF for MoMo charges. Override with GENIUSPAY_USD_TO_XOF
 * (docs example uses ~600).
 */
export function getUsdToXofRate() {
  const n = Number(process.env.GENIUSPAY_USD_TO_XOF || 600);
  if (!Number.isFinite(n) || n <= 0) return 600;
  return n;
}

/** Round USD stay total to whole XOF (GeniusPay amount is major units). */
export function usdToXof(amountUsd, rate = getUsdToXofRate()) {
  const usd = Number(amountUsd);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const xof = Math.round(usd * rate);
  return xof >= 200 ? xof : null;
}

/**
 * Map the guest currency selector to a GeniusPay charge plan.
 * - African MoMo currencies → XOF, open checkout (MoMo + card)
 * - EUR → charge EUR, card/wallet rail only
 * - Everything else international → charge USD, card/wallet rail only
 */
export function resolveGeniusPayCheckoutPlan(selectedCurrency) {
  const selected = String(selectedCurrency || "USD")
    .trim()
    .toUpperCase() || "USD";

  const african = AFRICAN_MOMO_CURRENCIES.has(selected);

  if (african) {
    return {
      selectedCurrency: selected,
      chargeCurrency: "XOF",
      rail: "africa",
      // Hosted checkout — guest picks Wave / Orange / MTN / card
      paymentMethod: null,
      allowedMethods: null,
    };
  }

  const chargeCurrency = selected === "EUR" ? "EUR" : "USD";
  return {
    selectedCurrency: selected,
    chargeCurrency,
    rail: "international",
    // Card rail surfaces Visa/Mastercard + Apple Pay / Google Pay on Stripe
    paymentMethod: null,
    allowedMethods: ["card"],
  };
}

/**
 * Convert a USD stay total into GeniusPay major units for the charge currency.
 * @returns {{ amount: number, rate: number } | null}
 */
export function convertUsdToGeniusPayAmount(amountUsd, chargeCurrency, fxRate) {
  const usd = Number(amountUsd);
  const currency = String(chargeCurrency || "XOF").toUpperCase();
  if (!Number.isFinite(usd) || usd <= 0) return null;

  if (currency === "XOF") {
    const rate =
      Number.isFinite(Number(fxRate)) && Number(fxRate) > 0
        ? Number(fxRate)
        : getUsdToXofRate();
    const amount = Math.round(usd * rate);
    return amount >= 200 ? { amount, rate } : null;
  }

  if (currency === "USD") {
    const amount = Math.round(usd * 100) / 100;
    return amount >= 1 ? { amount, rate: 1 } : null;
  }

  if (currency === "EUR") {
    const rate =
      Number.isFinite(Number(fxRate)) && Number(fxRate) > 0
        ? Number(fxRate)
        : Number(process.env.GENIUSPAY_USD_TO_EUR || 0.92);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    const amount = Math.round(usd * rate * 100) / 100;
    return amount >= 1 ? { amount, rate } : null;
  }

  return null;
}

/**
 * Resolve USD→charge FX. Prefers live open.er-api.com; falls back to env defaults.
 */
export async function resolveGeniusPayFxRate(chargeCurrency) {
  const currency = String(chargeCurrency || "XOF").toUpperCase();
  if (currency === "USD") return 1;
  if (currency === "XOF") return getUsdToXofRate();

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    const data = await res.json().catch(() => ({}));
    const rate = Number(data?.rates?.[currency]);
    if (Number.isFinite(rate) && rate > 0) return rate;
  } catch {
    /* fall through */
  }

  if (currency === "EUR") {
    const fallback = Number(process.env.GENIUSPAY_USD_TO_EUR || 0.92);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 0.92;
  }
  return null;
}

async function geniusPayFetch(path, { method = "GET", body } = {}) {
  const apiKey = getGeniusPayPublicKey();
  const apiSecret = getGeniusPaySecretKey();
  if (!apiKey || !apiSecret) {
    throw new Error(
      "GeniusPay is not configured (GENIUSPAY_API_KEY + GENIUSPAY_API_SECRET)",
    );
  }

  const res = await fetch(`${getGeniusPayApiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.error ||
      (typeof data?.detail === "string" ? data.detail : null) ||
      `GeniusPay API ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * Create a hosted checkout.
 * - Africa / XOF: omit payment_method → MoMo + card chooser
 * - International EUR/USD: pass allowed_methods=["card"] so checkout
 *   offers card + Apple Pay / Google Pay (Stripe rail), not Wave/Orange/MTN
 */
export async function createGeniusPayPayment({
  amount,
  amountXof,
  currency = "XOF",
  paymentMethod = null,
  allowedMethods = null,
  description,
  customer,
  successUrl,
  errorUrl,
  metadata,
}) {
  const chargeCurrency = String(currency || "XOF").toUpperCase();
  const rawAmount = amount != null ? Number(amount) : Number(amountXof);
  const chargeAmount =
    chargeCurrency === "XOF"
      ? Math.round(rawAmount)
      : Math.round(rawAmount * 100) / 100;

  if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
    throw new Error("GeniusPay amount is invalid");
  }
  if (chargeCurrency === "XOF" && chargeAmount < 200) {
    throw new Error("GeniusPay amount must be at least 200 XOF");
  }
  if (
    (chargeCurrency === "EUR" || chargeCurrency === "USD") &&
    chargeAmount < 1
  ) {
    throw new Error(`GeniusPay amount must be at least 1 ${chargeCurrency}`);
  }

  const payload = {
    amount: chargeAmount,
    currency: GENIUSPAY_CHARGE_CURRENCIES.has(chargeCurrency)
      ? chargeCurrency
      : "XOF",
    ...(paymentMethod ? { payment_method: String(paymentMethod) } : {}),
    ...(Array.isArray(allowedMethods) && allowedMethods.length
      ? {
          // Flutter SDK uses allowedMethods; REST accepts snake_case equivalents.
          allowed_methods: allowedMethods.map((m) => String(m)),
        }
      : {}),
    ...(description ? { description: sanitizeMetaValue(description) } : {}),
    ...(customer
      ? {
          customer: {
            ...(customer.name
              ? { name: sanitizeMetaValue(customer.name) }
              : {}),
            ...(customer.email
              ? { email: sanitizeMetaValue(customer.email) }
              : {}),
            ...(customer.phone
              ? { phone: sanitizeMetaValue(customer.phone) }
              : {}),
            ...(customer.country
              ? { country: sanitizeMetaValue(customer.country) }
              : {}),
          },
        }
      : {}),
    ...(successUrl ? { success_url: successUrl } : {}),
    ...(errorUrl ? { error_url: errorUrl } : {}),
    ...(metadata ? { metadata: sanitizeMetadata(metadata) } : {}),
  };

  const result = await geniusPayFetch("/payments", {
    method: "POST",
    body: payload,
  }).catch(async (err) => {
    // Older API builds may reject allowed_methods — retry without it so
    // currency still propagates (EUR/USD → card/wallet UI on checkout).
    if (
      Array.isArray(allowedMethods) &&
      allowedMethods.length &&
      payload.allowed_methods
    ) {
      const { allowed_methods: _ignored, ...withoutAllowed } = payload;
      try {
        return await geniusPayFetch("/payments", {
          method: "POST",
          body: withoutAllowed,
        });
      } catch {
        throw err;
      }
    }
    throw err;
  });

  return result?.data || result;
}

export async function getGeniusPayPayment(reference) {
  const ref = encodeURIComponent(String(reference || "").trim());
  if (!ref) throw new Error("Payment reference is required");
  const result = await geniusPayFetch(`/payments/${ref}`, { method: "GET" });
  return result?.data || result;
}
