/**
 * Checkout payment mode for Isisel.
 *
 * Default: offline / arrange-with-host (local mobile money with the host).
 * Set NEXT_PUBLIC_USE_PAYMENT_GATEWAY=true to enable online card checkout.
 *
 * Provider (when gateway is on):
 *   NEXT_PUBLIC_PAYMENT_PROVIDER=creem|flutterwave
 * Default provider is creem when CREEM_API_KEY is configured, else flutterwave.
 */

export const PAYMENT_PROVIDER_CREEM = "creem";
export const PAYMENT_PROVIDER_FLUTTERWAVE = "flutterwave";

export function isPaymentGatewayCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_USE_PAYMENT_GATEWAY === "true";
}

/**
 * Active online provider when gateway checkout is enabled.
 * Returns null when guests should arrange payment with the host.
 */
export function getPaymentProvider() {
  if (!isPaymentGatewayCheckoutEnabled()) return null;

  const raw = String(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (raw === PAYMENT_PROVIDER_CREEM || raw === PAYMENT_PROVIDER_FLUTTERWAVE) {
    return raw;
  }

  // Prefer Creem for international card MoR when the secret key is present.
  if (process.env.CREEM_API_KEY) return PAYMENT_PROVIDER_CREEM;
  return PAYMENT_PROVIDER_FLUTTERWAVE;
}

export function isCreemCheckoutEnabled() {
  return getPaymentProvider() === PAYMENT_PROVIDER_CREEM;
}

export function isFlutterwaveCheckoutEnabled() {
  return getPaymentProvider() === PAYMENT_PROVIDER_FLUTTERWAVE;
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
