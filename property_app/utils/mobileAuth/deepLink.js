/**
 * Resolve allowlisted Expo return base (`isisel://auth` or HTTPS web landing).
 * Env `MOBILE_DEEP_LINK_SCHEME` may restate a value already in the allowlist.
 */

import {
  DEFAULT_MOBILE_DEEP_LINK,
  MOBILE_DEEP_LINK_ALLOWLIST,
} from "@/utils/mobileAuth/constants";

/**
 * Normalize a return URL to scheme://host[/path] for allowlist comparison.
 * Custom schemes: isisel://auth → hostname is the path segment.
 * HTTPS: keeps pathname so https://app.isisel.com/auth matches exactly.
 * @param {string} candidate
 * @returns {string|null}
 */
export function normalizeDeepLinkBase(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  try {
    const url = new URL(candidate.trim());
    if (!url.protocol) return null;
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (!url.hostname) return null;
      const path = (url.pathname || "/").replace(/\/$/, "") || "";
      return `${url.protocol}//${url.hostname}${path}`;
    }
    // Custom schemes (isisel://auth)
    if (!url.hostname) return null;
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

/**
 * @returns {string}
 */
export function getMobileDeepLinkBase() {
  const configured = String(
    process.env.MOBILE_DEEP_LINK_SCHEME || DEFAULT_MOBILE_DEEP_LINK,
  )
    .trim()
    .replace(/\/$/, "");
  const normalized = normalizeDeepLinkBase(configured) || configured;
  if (MOBILE_DEEP_LINK_ALLOWLIST.includes(normalized)) {
    return normalized;
  }
  return DEFAULT_MOBILE_DEEP_LINK;
}

/**
 * True when the candidate is exactly an allowlisted return target (no open redirects).
 * @param {string} candidate
 * @returns {boolean}
 */
export function isAllowedMobileDeepLink(candidate) {
  const normalized = normalizeDeepLinkBase(candidate);
  if (!normalized) return false;
  return MOBILE_DEEP_LINK_ALLOWLIST.includes(normalized);
}

/**
 * Pick allowlisted return base from an optional client `redirect_uri`.
 * Falls back to default native deep link when missing / not allowlisted.
 * @param {string|null|undefined} redirectUri
 * @returns {string}
 */
export function resolveMobileDeepLinkBase(redirectUri) {
  if (redirectUri && isAllowedMobileDeepLink(redirectUri)) {
    return normalizeDeepLinkBase(redirectUri) || getMobileDeepLinkBase();
  }
  return getMobileDeepLinkBase();
}

/**
 * Build return URL with ?code= / ?error= (+ optional state). Never includes JWTs.
 * @param {{ code?: string|null, state?: string|null, error?: string|null, base?: string|null }} params
 * @returns {string}
 */
export function buildMobileDeepLink({
  code = null,
  state = null,
  error = null,
  base = null,
} = {}) {
  const rawBase = base && isAllowedMobileDeepLink(base) ? base : getMobileDeepLinkBase();
  const url = new URL(rawBase);
  if (error) {
    url.searchParams.set("error", String(error).slice(0, 64));
  } else if (code) {
    url.searchParams.set("code", code);
  }
  if (state) {
    url.searchParams.set("state", String(state).slice(0, 256));
  }
  return url.toString();
}
