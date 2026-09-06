import { isOpsStaff } from "@/utils/opsAuth";

/**
 * Soft-launch allowlist for online checkout (Creem card + GeniusPay MoMo).
 * Everyone else keeps arrange-with-host / manual reservation.
 *
 * Allow when:
 *   - the signed-in user is ops staff (admin / superadmin) — any listing
 *   - the signed-in user is partner Sadio Diallo
 *   - the listing host is partner Sadio Diallo (any guest can pay online)
 *
 * Extra emails: PAYMENT_PARTNER_EMAILS or NEXT_PUBLIC_PAYMENT_PARTNER_EMAILS
 * (comma-separated).
 */

/** Partner display names / usernames (case-insensitive, collapsed spaces). */
export const PAYMENT_PARTNER_NAMES = Object.freeze(["sadio diallo"]);

/** Known partner emails if/when confirmed in production. */
export const PAYMENT_PARTNER_EMAILS = Object.freeze([
  // Add Sadio's login email here when known, e.g. "sadio@…",
]);

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePersonName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function envEmailAllowlist() {
  const raw = [
    process.env.PAYMENT_PARTNER_EMAILS,
    process.env.NEXT_PUBLIC_PAYMENT_PARTNER_EMAILS,
  ]
    .filter(Boolean)
    .join(",");
  return raw
    .split(",")
    .map((part) => normalizeEmail(part))
    .filter(Boolean);
}

function partnerEmailSet() {
  return new Set([
    ...PAYMENT_PARTNER_EMAILS.map(normalizeEmail),
    ...envEmailAllowlist(),
  ]);
}

function partnerNameSet() {
  return new Set(PAYMENT_PARTNER_NAMES.map(normalizePersonName));
}

/**
 * @param {object | null | undefined} person - user, seller_info, or host-like
 * @returns {boolean}
 */
export function isPaymentPartnerPerson(person) {
  if (!person) return false;

  const email = normalizeEmail(person.email);
  if (email && partnerEmailSet().has(email)) return true;

  const names = partnerNameSet();
  const candidates = [
    person.name,
    person.username,
    person.displayName,
  ];
  for (const candidate of candidates) {
    const normalized = normalizePersonName(candidate);
    if (normalized && names.has(normalized)) return true;
  }
  return false;
}

/**
 * True when this listing belongs to a payment partner host.
 * @param {object | null | undefined} property
 */
export function isPaymentPartnerListing(property) {
  if (!property) return false;
  if (isPaymentPartnerPerson(property.seller_info)) return true;
  if (isPaymentPartnerPerson(property.host)) return true;
  if (isPaymentPartnerPerson(property.owner)) return true;
  // Populated owner document
  if (
    property.owner &&
    typeof property.owner === "object" &&
    isPaymentPartnerPerson(property.owner)
  ) {
    return true;
  }
  return false;
}

/**
 * @param {object | null | undefined} sessionOrUser - next-auth session, or user
 * @param {object | null | undefined} [property] - listing being booked
 * @returns {boolean}
 */
export function canUseOnlineCheckout(sessionOrUser, property) {
  const user = sessionOrUser?.user ?? sessionOrUser;

  if (user && isOpsStaff(user.role)) return true;
  if (isPaymentPartnerPerson(user)) return true;
  if (isPaymentPartnerListing(property)) return true;

  return false;
}
