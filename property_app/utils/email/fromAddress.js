import {
  BRAND_EMAIL,
  EMAIL_FROM_DEFAULT,
  SEND_FROM_EMAIL,
  SEND_FROM_NAME,
} from "@/utils/brand";

/**
 * From-address for Resend. Person mailbox on isisel.com (not a role address).
 * Non-isisel.com env values (old personal Gmail, etc.) are ignored.
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
  if (raw.includes("<")) return raw;
  return `${SEND_FROM_NAME} <${raw}>`;
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
