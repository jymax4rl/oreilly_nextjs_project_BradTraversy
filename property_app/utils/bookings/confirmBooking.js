import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";
import { PAYMENT_MODE_GATEWAY } from "@/utils/bookings/paymentMode";
import {
  calculateBookingFees,
  calculateStayTotal,
  hasAnyRate,
  normalizeRates,
} from "@/utils/propertyRates";
import { resolveCommissionForProperty } from "@/utils/foundingHost/resolveCommission";
import { buildPricingCommissionFields } from "@/utils/foundingHost/logic";
import { notifyHostNewReservation } from "@/utils/push/webPush";
import {
  buildCreatorBookingFields,
  resolveOptionalPromoAttribution,
  applyGuestPromoDiscount,
} from "@/utils/creators/promoAttribution";
import { upsertCommissionForBooking } from "@/utils/creators/commissionEngine";

async function buildGatewayPricingSnapshot({
  propertyId,
  property,
  availability,
  checkIn,
  checkOut,
  amount,
  currency,
  guestDiscountRate = 0,
  promoCodeLabel,
}) {
  const nights = countNights(checkIn, checkOut);
  const listingRates = normalizeRates(property?.rates);
  const resolved = await resolveCommissionForProperty(property);

  if (property && hasAnyRate(listingRates)) {
    const stayPricing = calculateStayTotal(
      listingRates,
      availability?.customDayRates || [],
      checkIn,
      checkOut,
    );
    if (stayPricing) {
      const discount = applyGuestPromoDiscount(
        stayPricing.base,
        guestDiscountRate,
      );
      const { cleaningFee, commission, total } = calculateBookingFees(
        discount.discountedBase,
        { commissionRate: resolved.commissionRate },
      );
      return {
        nightlyRate: discount.discountedBase / Math.max(nights, 1),
        accommodationBase: discount.discountedBase,
        accommodationBeforePromo: discount.originalBase,
        cleaningFee,
        total,
        nights,
        currency: "USD",
        ...(discount.guestDiscountAmount > 0
          ? {
              promoCode: promoCodeLabel,
              promoDiscountRate: discount.guestDiscountRate,
              promoDiscountAmount: discount.guestDiscountAmount,
            }
          : {}),
        ...buildPricingCommissionFields({ commission, resolved }),
      };
    }
  }

  if (amount == null) return undefined;

  const snapshot = {
    total: Number(amount),
    currency: currency || "USD",
    nights,
  };
  if (resolved.commissionWaived) {
    Object.assign(
      snapshot,
      buildPricingCommissionFields({ commission: 0, resolved }),
    );
  }
  return snapshot;
}

/**
 * Create or return a confirmed booking after verified payment.
 * Idempotent on transactionId.
 */
export async function confirmBookingFromPayment({
  propertyId,
  guestId,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  transactionId,
  amount,
  currency,
  propertyName,
  promoCode,
}) {
  if (!propertyId || !guestId || !checkIn || !checkOut) {
    return {
      ok: false,
      error: "Missing booking fields (property, guest, or dates)",
    };
  }

  if (transactionId != null) {
    const existing = await Booking.findOne({ transactionId }).lean();
    if (existing) {
      return { ok: true, booking: existing, created: false };
    }
  }

  const availability = await getAvailabilityPayload(propertyId);
  const validation = validateStayDates(
    checkIn,
    checkOut,
    availability.unavailableRanges || [],
  );
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error || "Dates are no longer available",
    };
  }

  const property = await Property.findById(propertyId)
    .select("name owner rates")
    .lean();

  const promoResult = await resolveOptionalPromoAttribution({
    propertyId,
    promoCode,
    guestId,
    guestEmail,
  });
  if (!promoResult.ok && promoCode) {
    console.warn(
      "[creator promo] ignored after payment:",
      promoResult.error,
    );
  }
  const attribution = promoResult.ok ? promoResult.attribution : null;

  const pricingSnapshot = await buildGatewayPricingSnapshot({
    propertyId,
    property,
    availability,
    checkIn: validation.checkIn,
    checkOut: validation.checkOut,
    amount,
    currency,
    guestDiscountRate: attribution?.guestDiscountRate || 0,
    promoCodeLabel: attribution?.creatorPromoCode,
  });

  // After payment, never block the stay on a bad promo — skip attribution instead.
  const creatorFields = buildCreatorBookingFields(
    attribution,
    pricingSnapshot?.accommodationBase ?? amount,
  );

  const booking = await Booking.create({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    guestId: String(guestId),
    guestName: guestName || undefined,
    guestEmail: guestEmail || undefined,
    guestPhone: guestPhone || undefined,
    checkIn: validation.checkIn,
    checkOut: validation.checkOut,
    status: "confirmed",
    paymentMode: PAYMENT_MODE_GATEWAY,
    transactionId: transactionId ?? undefined,
    amount: amount != null ? Number(amount) : pricingSnapshot?.total,
    currency: currency || pricingSnapshot?.currency || undefined,
    propertyName: propertyName || property?.name || undefined,
    version: 0,
    pricingSnapshot,
    ...creatorFields,
  });

  if (creatorFields.creatorAttributionStatus === "attributed") {
    try {
      await upsertCommissionForBooking(booking.toObject(), {
        actor: "booking.confirm",
      });
    } catch (err) {
      console.error("[creator commission] upsert failed:", err);
    }
  }

  if (property?.owner) {
    try {
      await notifyHostNewReservation({
        hostUserId: property.owner,
        propertyName: propertyName || property.name,
        guestName,
        checkIn: validation.checkIn,
        checkOut: validation.checkOut,
        bookingId: String(booking._id),
        status: "confirmed",
      });
    } catch (err) {
      console.error("[web-push] host notify failed:", err);
    }
  }

  return {
    ok: true,
    booking: booking.toObject(),
    created: true,
    nights: countNights(validation.checkIn, validation.checkOut),
  };
}
