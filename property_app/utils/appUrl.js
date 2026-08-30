export const DEFAULT_PRODUCTION_APP_URL = "https://www.isisel.com";

export function getAppBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return DEFAULT_PRODUCTION_APP_URL;
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * Absolute URL for app routes and static assets.
 * @param {string} path e.g. "/my-bookings" or "/brand/kama-logo.svg"
 */
export function appUrl(path = "") {
  const base = getAppBaseUrl();
  const normalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${normalized}`;
}

export function brandLogoUrl() {
  return appUrl("/brand/kama-logo.svg");
}
