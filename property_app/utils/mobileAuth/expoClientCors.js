/**
 * CORS for Expo web (app.isisel.com) calling dual-gate APIs with Bearer JWTs.
 *
 * Allowlisted Origins only (same set as guest catalogue + m.isisel.com).
 * Allows Authorization so Safari/Chrome can send mobile JWTs cross-origin.
 */

const DEFAULT_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
  "https://app.isisel.com",
  "https://m.isisel.com",
];

const ALLOW_HEADERS = "Authorization, Content-Type";
const ALLOW_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";

/**
 * @returns {string[]}
 */
export function getExpoClientAllowedOrigins() {
  const extras = String(process.env.EXPO_CORS_ORIGINS || process.env.CATALOG_CORS_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extras])];
}

/**
 * @param {string|null|undefined} origin
 * @returns {boolean}
 */
export function isAllowedExpoClientOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  return getExpoClientAllowedOrigins().includes(origin.trim());
}

/**
 * @param {Request} request
 * @returns {Headers}
 */
export function expoClientCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Access-Control-Allow-Credentials", "false");
  if (isAllowedExpoClientOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin.trim());
  }
  return headers;
}

/**
 * @param {Request} request
 * @returns {Response}
 */
export function expoClientCorsPreflight(request) {
  return new Response(null, {
    status: 204,
    headers: expoClientCorsHeaders(request),
  });
}

/**
 * @param {Request} request
 * @param {Response} response
 * @returns {Response}
 */
export function withExpoClientCors(request, response) {
  const cors = expoClientCorsHeaders(request);
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
export function expoClientCorsJson(request, data, status = 200) {
  return withExpoClientCors(request, Response.json(data, { status }));
}
