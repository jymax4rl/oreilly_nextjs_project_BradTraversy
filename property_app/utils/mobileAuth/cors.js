/**
 * CORS for Expo / mobile Bearer clients (no cookies).
 * Allows Authorization + JSON; reflects Origin when present, else *.
 */

const ALLOW_HEADERS = "Authorization, Content-Type";
const ALLOW_METHODS = "POST, OPTIONS";

/**
 * @param {Request} request
 * @returns {Headers}
 */
export function mobileCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin || "*");
  headers.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  // Bearer auth — do not encourage credentialed cookie cross-origin.
  headers.set("Access-Control-Allow-Credentials", "false");
  return headers;
}

/**
 * @param {Request} request
 * @returns {Response}
 */
export function mobileCorsPreflight(request) {
  return new Response(null, {
    status: 204,
    headers: mobileCorsHeaders(request),
  });
}

/**
 * @param {Request} request
 * @param {BodyInit|null} body
 * @param {ResponseInit} [init]
 * @returns {Response}
 */
export function mobileCorsResponse(request, body, init = {}) {
  const headers = mobileCorsHeaders(request);
  const initHeaders = new Headers(init.headers || undefined);
  initHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(body, { ...init, headers });
}

/**
 * @param {Request} request
 * @param {unknown} data
 * @param {number} [status=200]
 * @returns {Response}
 */
export function mobileCorsJson(request, data, status = 200) {
  return mobileCorsResponse(request, JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
