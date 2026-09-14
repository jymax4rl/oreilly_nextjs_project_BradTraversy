/** Access JWT lifetime (seconds). */
export const ACCESS_TOKEN_EXPIRES_IN = 900;

/** Refresh token lifetime (days). */
export const REFRESH_TOKEN_DAYS = 30;

/** JWT `typ` claim for mobile access tokens. */
export const ACCESS_TOKEN_TYP = "access";

/** One-time OAuth deep-link exchange code TTL (seconds). */
export const MOBILE_AUTH_CODE_TTL_SECONDS = 90;

/**
 * Allowlisted Expo return targets after NextAuth Google (no open redirects).
 * - isisel://auth — native / custom builds
 * - https://app.isisel.com/auth — Expo web / PWA on the stable mobile domain
 */
export const MOBILE_DEEP_LINK_ALLOWLIST = Object.freeze([
  "isisel://auth",
  "https://app.isisel.com/auth",
]);

/** Default deep-link base (must be in MOBILE_DEEP_LINK_ALLOWLIST). */
export const DEFAULT_MOBILE_DEEP_LINK = "isisel://auth";
