export const SITE_ACCESS_COOKIE = "kama_site_access";
export const SITE_ACCESS_COOKIE_VALUE = "granted";

export function isSiteAccessGateEnabled() {
  if (process.env.SITE_ACCESS_GATE_ENABLED === "false") return false;
  if (process.env.SITE_ACCESS_GATE_ENABLED === "true") return true;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").toLowerCase();
  if (siteUrl.includes("isisel.com")) return true;

  return process.env.VERCEL_ENV === "production";
}

export function getSiteAccessCode() {
  return process.env.SITE_ACCESS_CODE || "1282";
}

export function hasSiteAccessCookie(cookieStore) {
  return cookieStore.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}
