/**
 * Minimal Creem REST client for Isisel stay checkouts.
 * Docs: https://docs.creem.io — test host is test-api.creem.io
 */

export function getCreemServer() {
  const explicit = String(process.env.CREEM_SERVER || "").toLowerCase();
  if (explicit === "test" || explicit === "live") return explicit;
  const key = process.env.CREEM_API_KEY || "";
  return key.startsWith("creem_test_") ? "test" : "live";
}

export function getCreemApiBase() {
  return getCreemServer() === "test"
    ? "https://test-api.creem.io/v1"
    : "https://api.creem.io/v1";
}

export function isCreemConfigured() {
  return Boolean(process.env.CREEM_API_KEY && process.env.CREEM_PRODUCT_ID);
}

async function creemFetch(path, { method = "GET", body } = {}) {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    throw new Error("CREEM_API_KEY is not set");
  }

  const res = await fetch(`${getCreemApiBase()}${path}`, {
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
      `Creem API ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * Create a one-time checkout with a dynamic USD amount (custom_price in cents).
 */
export async function createCreemCheckoutSession({
  productId,
  customPriceCents,
  successUrl,
  requestId,
  customer,
  metadata,
}) {
  return creemFetch("/checkouts", {
    method: "POST",
    body: {
      product_id: productId,
      custom_price: customPriceCents,
      success_url: successUrl,
      ...(requestId ? { request_id: requestId } : {}),
      ...(customer ? { customer } : {}),
      ...(metadata ? { metadata } : {}),
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
