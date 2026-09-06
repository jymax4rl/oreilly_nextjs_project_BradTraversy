/**
 * Checkout payment mode for Isisel.
 *
 * Default: offline / arrange-with-host (local mobile money with the host).
 * Set NEXT_PUBLIC_USE_PAYMENT_GATEWAY=true to enable online checkout.
 *
 * Production online split (both active when keys exist):
 *   - GeniusPay — Mobile Money (Wave, Orange, MTN, Moov)
 *   - Creem — Card (Visa / Mastercard)
 * Guests pick the method in the checkout modal.
 *
 * Optional: NEXT_PUBLIC_PAYMENT_PROVIDER=geniuspay|creem sets preferred
 * default when both are configured. Flutterwave is deprecated.
 */

export const PAYMENT_PROVIDER_CREEM = "creem";
export const PAYMENT_PROVIDER_GENIUSPAY = "geniuspay";
/** @deprecated Prefer GeniusPay for MoMo. */
export const PAYMENT_PROVIDER_FLUTTERWAVE = "flutterwave";

export function isPaymentGatewayCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_USE_PAYMENT_GATEWAY === "true";
}

function preferredProvider() {
  const raw = String(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (
    raw === PAYMENT_PROVIDER_CREEM ||
    raw === PAYMENT_PROVIDER_GENIUSPAY ||
    raw === PAYMENT_PROVIDER_FLUTTERWAVE
  ) {
    return raw;
  }
  return null;
}

function hasGeniusPayKeys() {
  return Boolean(
    String(
      process.env.GENIUSPAY_API_KEY || process.env.GENIUSPAY_PUBLIC_KEY || "",
    ).trim() &&
      String(
        process.env.GENIUSPAY_API_SECRET ||
          process.env.GENIUSPAY_SECRET_KEY ||
          "",
      ).trim(),
  );
}

function hasCreemKeys() {
  return Boolean(
    String(process.env.CREEM_API_KEY || "").trim() &&
      String(process.env.CREEM_PRODUCT_ID || "").trim(),
  );
}

/**
 * Preferred online provider when gateway checkout is enabled.
 * Prefers GeniusPay (MoMo) when configured; else Creem.
 * Returns null when guests should arrange payment with the host.
 */
export function getPaymentProvider() {
  if (!isPaymentGatewayCheckoutEnabled()) return null;

  const preferred = preferredProvider();
  if (preferred === PAYMENT_PROVIDER_FLUTTERWAVE) {
    return PAYMENT_PROVIDER_FLUTTERWAVE;
  }
  if (preferred === PAYMENT_PROVIDER_GENIUSPAY && hasGeniusPayKeys()) {
    return PAYMENT_PROVIDER_GENIUSPAY;
  }
  if (preferred === PAYMENT_PROVIDER_CREEM && hasCreemKeys()) {
    return PAYMENT_PROVIDER_CREEM;
  }

  if (hasGeniusPayKeys()) return PAYMENT_PROVIDER_GENIUSPAY;
  if (hasCreemKeys()) return PAYMENT_PROVIDER_CREEM;
  return null;
}

/** Creem card path — on when gateway is enabled and Creem keys exist. */
export function isCreemCheckoutEnabled() {
  return isPaymentGatewayCheckoutEnabled() && hasCreemKeys();
}

/** GeniusPay MoMo path — on when gateway is enabled and GeniusPay keys exist. */
export function isGeniusPayCheckoutEnabled() {
  return isPaymentGatewayCheckoutEnabled() && hasGeniusPayKeys();
}

/** @deprecated Flutterwave checkout is no longer offered in the UI. */
export function isFlutterwaveCheckoutEnabled() {
  return (
    isPaymentGatewayCheckoutEnabled() &&
    preferredProvider() === PAYMENT_PROVIDER_FLUTTERWAVE
  );
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
