/**
 * CORS for public catalogue reads from Expo web (guest, no cookies).
 *
 * Allowlisted Origins only — does not reflect arbitrary Origin (unlike
 * mobileAuth/cors which is for Bearer token routes).
 *
 * Methods: GET, HEAD, OPTIONS. Do not use for POST host listing create.
 */

const DEFAULT_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
];

const ALLOW_HEADERS = "Content-Type";
const ALLOW_METHODS = "GET, HEAD, OPTIONS";

/**
 * Built-in Expo web origins plus optional comma-separated extras from
 * `CATALOG_CORS_ORIGINS` (env-extendable allowlist).
 * @returns {string[]}
 */
export function getGuestCatalogAllowedOrigins() {
  const extras = String(process.env.CATALOG_CORS_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extras])];
}

/**
 * @param {string|null|undefined} origin
 * @returns {boolean}
 */
export function isAllowedGuestCatalogOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  return getGuestCatalogAllowedOrigins().includes(origin.trim());
}

/**
 * @param {Request} request
 * @returns {Headers}
 */
export function guestCatalogCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Access-Control-Allow-Credentials", "false");
  if (isAllowedGuestCatalogOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin.trim());
  }
  return headers;
}

/**
 * OPTIONS preflight — always 204; ACAO only when Origin is allowlisted.
 * @param {Request} request
 * @returns {Response}
 */
export function guestCatalogCorsPreflight(request) {
  return new Response(null, {
    status: 204,
    headers: guestCatalogCorsHeaders(request),
  });
}

/**
 * Merge guest catalogue CORS onto a Response (e.g. existing Response.json).
 * @param {Request} request
 * @param {Response} response
 * @returns {Response}
 */
export function withGuestCatalogCors(request, response) {
  const cors = guestCatalogCorsHeaders(request);
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * @param {Request} request
 * @param {unknown} data
 * @param {number} [status=200]
 * @returns {Response}
 */
export function guestCatalogCorsJson(request, data, status = 200) {
  return withGuestCatalogCors(
    request,
    Response.json(data, { status }),
  );
}
