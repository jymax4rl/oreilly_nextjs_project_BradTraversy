/**
 * Minimal Creem REST client for Isisel stay checkouts.
 * Docs: https://docs.creem.io — test host is test-api.creem.io
 *
 * Mode is derived from the API key prefix (never trust CREEM_SERVER alone):
 *   creem_test_… → test → https://test-api.creem.io/v1 → creem.io/test/checkout/…
 *   anything else → live → https://api.creem.io/v1 → creem.io/checkout/…
 */

/**
 * Prefer CREEM_PRODUCTION (live) when set, else CREEM_API_KEY (often test).
 */
function readCreemApiKey() {
  const raw = process.env.CREEM_PRODUCTION || process.env.CREEM_API_KEY || "";
  const apiKey = String(raw).trim();
  if (!apiKey) {
    throw new Error("CREEM_PRODUCTION or CREEM_API_KEY is not set");
  }
  // fetch() headers must be ByteString (code points ≤ 255). A pasted
  // ellipsis (…) or smart-quote in the Vercel env value throws:
  // "Cannot convert argument to a ByteString… character … 8230".
  for (let i = 0; i < apiKey.length; i += 1) {
    if (apiKey.charCodeAt(i) > 255) {
      throw new Error(
        "Creem API key contains a non-Latin-1 character (often a pasted …). Re-save the key in Vercel with plain ASCII only.",
      );
    }
  }
  return apiKey;
}

function keySource() {
  if (String(process.env.CREEM_PRODUCTION || "").trim()) {
    return "CREEM_PRODUCTION";
  }
  if (String(process.env.CREEM_API_KEY || "").trim()) {
    return "CREEM_API_KEY";
  }
  return null;
}

/** Keep metadata values header/JSON safe (strip exotic unicode). */
function sanitizeMetaValue(value) {
  if (value == null) return value;
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""); // printable ASCII + whitespace
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
 * Live vs test from the key itself. A leftover CREEM_SERVER=test must not
 * force test mode when CREEM_PRODUCTION holds a live key (and vice versa).
 */
export function getCreemServer() {
  const key = readCreemApiKey();
  if (key.startsWith("creem_test_")) return "test";
  return "live";
}

export function getCreemApiBase() {
  // Docs: https://docs.creem.io/getting-started/test-mode
  return getCreemServer() === "test"
    ? "https://test-api.creem.io/v1"
    : "https://api.creem.io/v1";
}

export function getCreemModeInfo() {
  try {
    const server = getCreemServer();
    return {
      mode: server,
      apiBase: getCreemApiBase(),
      keySource: keySource(),
      keyPrefix: readCreemApiKey().slice(0, 11),
    };
  } catch {
    return {
      mode: null,
      apiBase: null,
      keySource: keySource(),
      keyPrefix: null,
    };
  }
}

export function isCreemConfigured() {
  return Boolean(
    String(
      process.env.CREEM_PRODUCTION || process.env.CREEM_API_KEY || "",
    ).trim() && String(process.env.CREEM_PRODUCT_ID || "").trim(),
  );
}

/**
 * Refuse to start "live" checkout with a test key (would open creem.io/test/…).
 * Call from initialize when production traffic is expected.
 */
export function assertCreemLiveKeyIfRequired() {
  const wantLive =
    String(process.env.CREEM_SERVER || "").toLowerCase() === "live" ||
    Boolean(String(process.env.CREEM_PRODUCTION || "").trim());
  if (!wantLive) return;
  const key = readCreemApiKey();
  if (key.startsWith("creem_test_")) {
    const err = new Error(
      "Creem is configured for live (CREEM_PRODUCTION / CREEM_SERVER=live) but the active API key is still a test key (creem_test_…). Paste the live key from the Creem dashboard with Test Mode OFF into CREEM_PRODUCTION, and use a live CREEM_PRODUCT_ID.",
    );
    err.code = "CREEM_TEST_KEY_IN_LIVE";
    throw err;
  }
}

async function creemFetch(path, { method = "GET", body } = {}) {
  const apiKey = readCreemApiKey();
  const base = getCreemApiBase();

  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
      (Array.isArray(data?.message) ? data.message.join(", ") : null) ||
      `Creem API ${res.status}`;
    const err = new Error(
      typeof message === "string" ? message : JSON.stringify(message),
    );
    err.status = res.status;
    err.payload = data;
    err.creemMode = getCreemServer();
    err.creemApiBase = base;
    throw err;
  }
  return data;
}

/**
 * Create a one-time checkout with a dynamic USD amount (custom_price in cents).
 * Accepts either customPriceCents/successUrl or custom_price/success_url aliases.
 */
export async function createCreemCheckoutSession({
  productId,
  customPriceCents,
  custom_price,
  successUrl,
  success_url,
  requestId,
  request_id,
  customer,
  metadata,
}) {
  const price = customPriceCents ?? custom_price;
  const success = successUrl ?? success_url;
  const reqId = requestId ?? request_id;

  return creemFetch("/checkouts", {
    method: "POST",
    body: {
      product_id: productId,
      custom_price: price,
      success_url: success,
      ...(reqId ? { request_id: reqId } : {}),
      ...(customer
        ? {
            customer: {
              ...customer,
              name: customer.name ? sanitizeMetaValue(customer.name) : customer.name,
              email: customer.email
                ? sanitizeMetaValue(customer.email)
                : customer.email,
            },
          }
        : {}),
      ...(metadata ? { metadata: sanitizeMetadata(metadata) } : {}),
    },
  });
}

export function dollarsToCents(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function centsToDollars(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return null;
  return Math.round(n) / 100;
}
