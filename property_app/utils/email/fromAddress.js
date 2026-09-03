import {
  BRAND_EMAIL,
  EMAIL_FROM_DEFAULT,
  MARKETING_FROM_DEFAULT,
  MARKETING_FROM_NAME,
  MARKETING_REPLY_TO_EMAIL,
  SEND_FROM_EMAIL,
  SEND_FROM_NAME,
} from "@/utils/brand";

function wrapFrom(raw, fallback, displayName = SEND_FROM_NAME) {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  if (value.includes("<")) return value;
  if (value.includes("@")) return `${displayName} <${value}>`;
  return fallback;
}

function extractAddress(raw) {
  const value = String(raw || "").trim();
  const angled = value.match(/<([^>]+)>/);
  return (angled?.[1] || value).trim().toLowerCase();
}

function isVerifiedIsiselFrom(raw) {
  const address = extractAddress(raw);
  return address.endsWith("@isisel.com") && address !== "contact@isisel.com";
}

/**
 * From-address for booking / moderation Resend mail.
 * Must stay on the verified isisel.com domain.
 */
export function getEmailFrom() {
  const raw = String(process.env.EMAIL_FROM || "").trim();
  const lower = raw.toLowerCase();
  if (!raw || !lower.includes("@isisel.com")) {
    return EMAIL_FROM_DEFAULT;
  }
  // Role inboxes (contact@) tend to land in Gmail Promotions.
  if (lower.includes("contact@isisel.com")) {
    return EMAIL_FROM_DEFAULT;
  }
  return wrapFrom(raw, EMAIL_FROM_DEFAULT);
}

export function getEmailReplyTo() {
  const raw = String(process.env.EMAIL_REPLY_TO || "").trim();
  const lower = raw.toLowerCase();
  if (!lower.includes("@isisel.com") || lower.includes("contact@isisel.com")) {
    return SEND_FROM_EMAIL;
  }
  return raw;
}

/**
 * Resend From for ops Marketing letters.
 * Only @isisel.com is sendable. Vercel env is ignored on localhost — use .env.local.
 * Gmail values are skipped (Resend: domain not verified).
 */
export function getMarketingEmailFrom() {
  const dedicated = String(process.env.MARKETING_EMAIL_FROM || "").trim();
  if (dedicated && isVerifiedIsiselFrom(dedicated)) {
    return wrapFrom(dedicated, MARKETING_FROM_DEFAULT, MARKETING_FROM_NAME);
  }
  return MARKETING_FROM_DEFAULT;
}

export function getMarketingReplyTo() {
  const dedicated = String(process.env.MARKETING_EMAIL_REPLY_TO || "").trim();
  const address = extractAddress(dedicated);
  if (address.endsWith("@isisel.com") && address !== "contact@isisel.com") {
    return dedicated.includes("<") ? extractAddress(dedicated) : dedicated;
  }
  return MARKETING_REPLY_TO_EMAIL;
}

/**
 * Extra admin inboxes from env, always unioned with the business mailbox.
 */
export function getAdminNotificationEmailsFromEnv() {
  const raw = [
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_NOTIFICATION_EMAIL,
    process.env.EMAIL_REPLY_TO,
    BRAND_EMAIL,
  ]
    .filter(Boolean)
    .join(",");
  const unique = new Map();
  for (const email of String(raw).split(",")) {
    const trimmed = email.trim();
    if (!trimmed) continue;
    unique.set(trimmed.toLowerCase(), trimmed);
  }
  if (!unique.has(BRAND_EMAIL)) {
    unique.set(BRAND_EMAIL, BRAND_EMAIL);
  }
  return [...unique.values()];
}
