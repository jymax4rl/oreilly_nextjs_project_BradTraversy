/**
 * Checkout payment mode for Isisel.
 *
 * Default: offline / arrange-with-host (no Flutterwave redirect).
 * Set NEXT_PUBLIC_USE_PAYMENT_GATEWAY=true to restore gateway checkout.
 */
export function isPaymentGatewayCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_USE_PAYMENT_GATEWAY === "true";
}

/** Booking.paymentMode values */
export const PAYMENT_MODE_MANUAL = "manual";
export const PAYMENT_MODE_GATEWAY = "gateway";

/**
 * Normalize guest phone for storage / WhatsApp / tel: links.
 * Strips spaces and common separators; keeps a leading +.
 */
export function normalizeGuestPhone(raw) {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

/** Loose validation: enough digits for a real mobile/landline. */
export function isValidGuestPhone(raw) {
  const normalized = normalizeGuestPhone(raw);
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function guestPhoneTelHref(phone) {
  const normalized = normalizeGuestPhone(phone);
  if (!normalized) return null;
  return `tel:${normalized}`;
}

/** WhatsApp deep link (international digits, no +). */
export function guestPhoneWhatsAppHref(phone) {
  const digits = normalizeGuestPhone(phone).replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}`;
}
