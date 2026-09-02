/**
 * Public product name and mailboxes.
 * Mongo db name, CSS tokens (--kama-*), and Resend template aliases can stay as-is.
 */
export const BRAND_NAME = "Isisel";
/** Public inbox on the site, policies, and admin alerts. */
export const BRAND_EMAIL = "contact@isisel.com";
/** Personal mailbox used as Resend From for booking / moderation mail. */
export const SEND_FROM_NAME = "Camara Djehuty";
export const SEND_FROM_EMAIL = "camara-djehuty@isisel.com";
/**
 * Ops Marketing From + Reply-To. Both must be on verified isisel.com.
 * Resend cannot send as @gmail.com.
 */
export const MARKETING_FROM_NAME = "Jimmeh";
export const MARKETING_FROM_EMAIL = "jimmeh@isisel.com";
export const MARKETING_REPLY_TO_EMAIL = "jimmeh@isisel.com";
export const BRAND_SITE_HOST = "www.isisel.com";
export const BRAND_SITE_URL = "https://www.isisel.com";
export const WHATSAPP_E164 = "33784672083";
export const WHATSAPP_DISPLAY = "+33 7 84 67 20 83";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_E164}`;

/** Resend `from` — person + isisel.com domain (bookings, moderation). */
export const EMAIL_FROM_DEFAULT = `${SEND_FROM_NAME} <${SEND_FROM_EMAIL}>`;
export const MARKETING_FROM_DEFAULT = `${MARKETING_FROM_NAME} <${MARKETING_FROM_EMAIL}>`;

export const BRAND_TITLE_DEFAULT = `${BRAND_NAME} | African Vacation Rentals`;
export const BRAND_TITLE_TEMPLATE = `%s | ${BRAND_NAME}`;
