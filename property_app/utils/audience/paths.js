import { BRAND_EMAIL, BRAND_SITE_URL, WHATSAPP_URL } from "@/utils/brand";

export const AUDIENCE_ONBOARDING = "/host/onboarding";
export const AUDIENCE_CATALOG = "/properties";
export const AUDIENCE_ADD_PROPERTY = "/properties/add";
export const AUDIENCE_POLICIES = "/policies";
export const AUDIENCE_CONTACT_MAIL = `mailto:${BRAND_EMAIL}`;

export function onboardingHref(source, cta) {
  const params = new URLSearchParams();
  if (source) params.set("from", source);
  if (cta) params.set("cta", cta);
  const q = params.toString();
  return q ? `${AUDIENCE_ONBOARDING}?${q}` : AUDIENCE_ONBOARDING;
}

export function contactMailto(subject) {
  const params = new URLSearchParams({
    subject: subject || "Isisel for my hospitality business",
  });
  return `${AUDIENCE_CONTACT_MAIL}?${params.toString()}`;
}

export function whatsappHref() {
  return WHATSAPP_URL;
}

export function siteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || BRAND_SITE_URL).replace(
    /\/$/,
    "",
  );
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
