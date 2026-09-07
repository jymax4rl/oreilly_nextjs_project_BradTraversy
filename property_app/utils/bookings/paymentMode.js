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
 *
 * Important: secret keys (CREEM_*, GENIUSPAY_*) are server-only and are NOT
 * available in the browser bundle. Client UI therefore treats the public
 * gateway flag as the source of truth for offering MoMo/card; API routes
 * still require real secrets via isCreemCheckoutConfigured /
 * isGeniusPayCheckoutConfigured.
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

function publicMethodFlag(name) {
  const raw = String(process.env[name] || "")
    .trim()
    .toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return null;
}

export function hasGeniusPayKeys() {
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

export function hasCreemKeys() {
  return Boolean(
    String(
      process.env.CREEM_PRODUCTION || process.env.CREEM_API_KEY || "",
    ).trim() && String(process.env.CREEM_PRODUCT_ID || "").trim(),
  );
}

/**
 * Preferred online provider when gateway checkout is enabled.
 * Prefers GeniusPay (MoMo) when configured; else Creem.
 * Returns null when guests should arrange payment with the host.
 * Server-only (uses secret key presence).
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

/**
 * Client-safe: offer Creem card checkout in the UI when the public gateway
 * flag is on. Optional NEXT_PUBLIC_CREEM_CHECKOUT=false disables the method.
 * Does not read CREEM_API_KEY (unavailable in the browser).
 */
export function isCreemCheckoutEnabled() {
  if (!isPaymentGatewayCheckoutEnabled()) return false;
  return publicMethodFlag("NEXT_PUBLIC_CREEM_CHECKOUT") !== false;
}

/**
 * Client-safe: offer GeniusPay MoMo checkout in the UI when the public
 * gateway flag is on. Optional NEXT_PUBLIC_GENIUSPAY_CHECKOUT=false disables.
 */
export function isGeniusPayCheckoutEnabled() {
  if (!isPaymentGatewayCheckoutEnabled()) return false;
  return publicMethodFlag("NEXT_PUBLIC_GENIUSPAY_CHECKOUT") !== false;
}

/** Server-only: UI flag + real Creem secrets present. */
export function isCreemCheckoutConfigured() {
  return isCreemCheckoutEnabled() && hasCreemKeys();
}

/** Server-only: UI flag + real GeniusPay secrets present. */
export function isGeniusPayCheckoutConfigured() {
  return isGeniusPayCheckoutEnabled() && hasGeniusPayKeys();
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
