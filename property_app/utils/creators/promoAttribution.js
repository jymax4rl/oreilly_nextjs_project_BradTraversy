import CreatorPromoCode from "@/models/CreatorPromoCode";
import CreatorPartner from "@/models/CreatorPartner";
import Property from "@/models/Property";
import { TRAINING_BOOKING_SOURCE } from "@/utils/opsTraining/constants";

export function normalizePromoCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 32);
}

export function isValidPromoCodeFormat(code) {
  return /^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(code);
}

/**
 * Resolve an active host promo code for a property at booking time.
 * Returns attribution fields to stamp on Booking, or null.
 */
export async function resolveCreatorPromoAttribution({
  propertyId,
  promoCode,
  guestId,
  guestEmail,
  source,
}) {
  if (source === TRAINING_BOOKING_SOURCE) return null;

  const code = normalizePromoCode(promoCode);
  if (!code || !propertyId) return null;
  if (!isValidPromoCodeFormat(code)) {
    return { ok: false, error: "That promo code is not valid" };
  }

  const promo = await CreatorPromoCode.findOne({
    code,
    propertyId,
    status: "active",
  }).lean();

  if (!promo) {
    return { ok: false, error: "Promo code not found for this listing" };
  }

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
    return { ok: false, error: "This promo code is not active yet" };
  }
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) {
    return { ok: false, error: "This promo code has expired" };
  }

  const partner = await CreatorPartner.findById(promo.creatorPartnerId)
    .select("name email status hostId")
    .lean();
  if (!partner || partner.status !== "active") {
    return { ok: false, error: "This creator partnership is not active" };
  }

  const property = await Property.findById(propertyId).select("owner").lean();
  if (!property || String(property.owner) !== String(promo.hostId)) {
    return { ok: false, error: "Promo code not found for this listing" };
  }

  const guestEmailNorm = String(guestEmail || "")
    .trim()
    .toLowerCase();
  if (
    partner.email &&
    guestEmailNorm &&
    partner.email === guestEmailNorm
  ) {
    return { ok: false, error: "Creators cannot use their own promo code" };
  }
  if (guestId && String(guestId) === String(promo.hostId)) {
    return { ok: false, error: "Hosts cannot attribute their own stay" };
  }

  const rate = Number(promo.commissionRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
    return { ok: false, error: "Invalid commission rate on this promo" };
  }

  return {
    ok: true,
    attribution: {
      creatorPromoCode: promo.code,
      creatorPromoCodeId: String(promo._id),
      creatorPartnerId: String(partner._id),
      creatorPartnerName: partner.name || "",
      creatorCommissionRate: rate,
      creatorHostId: String(promo.hostId),
    },
  };
}

export function buildCreatorBookingFields(attribution, accommodationBase) {
  if (!attribution) return {};
  const base = Math.max(0, Number(accommodationBase) || 0);
  const rate = Number(attribution.creatorCommissionRate) || 0;
  const amount = Math.round(base * rate * 100) / 100;
  return {
    creatorPromoCode: attribution.creatorPromoCode,
    creatorPromoCodeId: attribution.creatorPromoCodeId || undefined,
    creatorPartnerId: attribution.creatorPartnerId || undefined,
    creatorPartnerName: attribution.creatorPartnerName || undefined,
    creatorCommissionRate: rate,
    creatorCommissionBase: base,
    creatorCommissionAmount: amount,
    creatorHostId: attribution.creatorHostId,
    creatorAttributionStatus: "attributed",
  };
}

/**
 * Resolve promo for booking create. Empty code → no attribution.
 * Invalid code → { ok: false, error }.
 */
export async function resolveOptionalPromoAttribution(args) {
  const code = normalizePromoCode(args.promoCode);
  if (!code) return { ok: true, attribution: null };
  const result = await resolveCreatorPromoAttribution({
    ...args,
    promoCode: code,
  });
  if (!result) return { ok: true, attribution: null };
  if (result.ok === false) return result;
  return { ok: true, attribution: result.attribution };
}
