import { BRAND_SITE_URL } from "@/utils/brand";

function allowedOrigins() {
  const extras = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    BRAND_SITE_URL,
    "https://www.isisel.com",
    "https://isisel.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  return extras
    .filter(Boolean)
    .map((value) => String(value).trim().replace(/\/$/, "").toLowerCase());
}

function originOf(url) {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * CSRF: Origin/Referer must match this deployment or a known Isisel origin.
 * Matching request.url origin covers Vercel preview URLs without a denylist gap.
 */
export function isAllowedCreatorOrigin(request) {
  const requestOrigin = originOf(request.url);
  const allowed = new Set(allowedOrigins());
  if (requestOrigin) allowed.add(requestOrigin);

  const origin = (request.headers.get("origin") || "").toLowerCase().replace(/\/$/, "");
  if (origin) return allowed.has(origin);

  const referer = request.headers.get("referer");
  if (referer) {
    const refOrigin = originOf(referer);
    return Boolean(refOrigin && allowed.has(refOrigin));
  }
  return false;
}

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim().slice(0, 80);
  }
  return (request.headers.get("x-real-ip") || "unknown").slice(0, 80);
}
