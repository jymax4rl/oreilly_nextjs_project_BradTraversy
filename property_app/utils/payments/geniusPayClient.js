/**
 * GeniusPay merchant API client (Wave / Orange / MTN / Moov / card checkout).
 * Docs: https://geniuspay.ci/docs/api
 * Base: https://geniuspay.ci/api/v1/merchant
 */

const DEFAULT_BASE = "https://geniuspay.ci/api/v1/merchant";

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
 * Create a hosted checkout (omit payment_method → Wave / Orange / MTN / card).
 * Amount is XOF by default for MoMo reliability.
 */
export async function createGeniusPayPayment({
  amountXof,
  currency = "XOF",
  description,
  customer,
  successUrl,
  errorUrl,
  metadata,
}) {
  const amount = Math.round(Number(amountXof));
  if (!Number.isFinite(amount) || amount < 200) {
    throw new Error("GeniusPay amount must be at least 200 XOF");
  }

  const payload = {
    amount,
    currency: String(currency || "XOF").toUpperCase(),
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
  });

  return result?.data || result;
}

export async function getGeniusPayPayment(reference) {
  const ref = encodeURIComponent(String(reference || "").trim());
  if (!ref) throw new Error("Payment reference is required");
  const result = await geniusPayFetch(`/payments/${ref}`, { method: "GET" });
  return result?.data || result;
}
