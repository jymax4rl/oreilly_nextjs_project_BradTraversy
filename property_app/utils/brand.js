/**
 * Public product name and mailboxes.
 * Mongo db name, CSS tokens (--kama-*), and Resend template aliases can stay as-is.
 */
export const BRAND_NAME = "Isisel";
/** Public inbox on the site, policies, and admin alerts. */
export const BRAND_EMAIL = "contact@isisel.com";
/** Personal mailbox used as Resend From (Gmail treats role addresses as Promotions). */
export const SEND_FROM_NAME = "Camara Djehuty";
export const SEND_FROM_EMAIL = "camara-djehuty@isisel.com";
export const BRAND_SITE_HOST = "www.isisel.com";
export const BRAND_SITE_URL = "https://www.isisel.com";

/** Resend `from` — person + isisel.com domain. */
export const EMAIL_FROM_DEFAULT = `${SEND_FROM_NAME} <${SEND_FROM_EMAIL}>`;

export const BRAND_TITLE_DEFAULT = `${BRAND_NAME} | African Vacation Rentals`;
export const BRAND_TITLE_TEMPLATE = `%s | ${BRAND_NAME}`;
