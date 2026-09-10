/**
 * Map raw fetch / runtime / service-worker failures to copy safe for guests.
 * Never surface stack traces, FetchEvent internals, or infra details in the UI.
 */

const TECHNICAL_PATTERNS = [
  /fetchevent/i,
  /respondwith/i,
  /service\s*worker/i,
  /^offline$/i,
  /error:\s*offline/i,
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
  /network request failed/i,
  /econnrefused/i,
  /enotfound/i,
  /etimedout/i,
  /socket hang up/i,
  /unexpected token/i,
  /syntaxerror/i,
  /mongo(db|ose)?/i,
  /prisma/i,
  /internal server error/i,
  /status code/i,
  /\bstack\b/i,
  /at\s+\S+\s+\(/i,
  /api[_ ]?key/i,
  /vercel/i,
  /next\.js/i,
  /typeerror:/i,
  /referenceerror:/i,
];

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function toUserFacingError(err, fallback = DEFAULT_FALLBACK) {
  const safeFallback =
    typeof fallback === "string" && fallback.trim()
      ? fallback.trim()
      : DEFAULT_FALLBACK;

  let raw = "";
  if (typeof err === "string") raw = err;
  else if (err && typeof err === "object") {
    if (typeof err.message === "string") raw = err.message;
    else if (typeof err.error === "string") raw = err.error;
  }
  raw = String(raw || "").trim();
  if (!raw) return safeFallback;

  // Multi-line / stack-looking payloads are never guest-safe.
  if (raw.includes("\n") || raw.length > 160) return safeFallback;

  if (TECHNICAL_PATTERNS.some((re) => re.test(raw))) return safeFallback;

  // Looks like a code identifier or HTTP plumbing.
  if (/^[A-Z][a-zA-Z]+Error\b/.test(raw)) return safeFallback;
  if (/^\d{3}\b/.test(raw)) return safeFallback;

  return raw;
}

/**
 * True when the failure is likely connectivity / SW / aborted fetch.
 * @param {unknown} err
 */
export function isRetryableClientError(err) {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && typeof err.message === "string"
        ? err.message
        : String(err || "");
  return /fetchevent|respondwith|offline|failed to fetch|networkerror|load failed|network request failed|abort|timeout|timed?\s*out/i.test(
    raw,
  );
}
