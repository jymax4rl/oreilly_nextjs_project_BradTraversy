/**
 * Resolve allowlisted Expo deep-link base (`isisel://auth` only).
 * Env `MOBILE_DEEP_LINK_SCHEME` may restate the default; other values are ignored.
 */

import {
  DEFAULT_MOBILE_DEEP_LINK,
  MOBILE_DEEP_LINK_ALLOWLIST,
} from "@/utils/mobileAuth/constants";

/**
 * @returns {string}
 */
export function getMobileDeepLinkBase() {
  const configured = String(
    process.env.MOBILE_DEEP_LINK_SCHEME || DEFAULT_MOBILE_DEEP_LINK
  )
    .trim()
    .replace(/\/$/, "");
  if (MOBILE_DEEP_LINK_ALLOWLIST.includes(configured)) {
    return configured;
  }
  return DEFAULT_MOBILE_DEEP_LINK;
}

/**
 * Normalize a deep-link URL to `scheme://host` for allowlist comparison.
 * @param {string} candidate
 * @returns {string|null}
 */
function normalizeDeepLinkBase(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  try {
    const url = new URL(candidate.trim());
    if (!url.protocol || !url.hostname) return null;
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

/**
 * True when the candidate is exactly the allowlisted deep link (no open redirects).
 * @param {string} candidate
 * @returns {boolean}
 */
export function isAllowedMobileDeepLink(candidate) {
  const normalized = normalizeDeepLinkBase(candidate);
  if (!normalized) return false;
  return MOBILE_DEEP_LINK_ALLOWLIST.includes(normalized);
}

/**
 * Build `isisel://auth?code=...` (+ optional state / error). Never includes JWTs.
 * @param {{ code?: string|null, state?: string|null, error?: string|null }} params
 * @returns {string}
 */
export function buildMobileDeepLink({
  code = null,
  state = null,
  error = null,
} = {}) {
  const url = new URL(getMobileDeepLinkBase());
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
