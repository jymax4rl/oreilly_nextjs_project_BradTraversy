import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";
import {
  PAYMENT_MODE_MANUAL,
  isValidGuestPhone,
  normalizeGuestPhone,
} from "@/utils/bookings/paymentMode";
import { sendEmailsForBooking } from "@/utils/bookings/finalizePaidTransaction";
import { resolveHostContact } from "@/utils/email/resolveHostContact";
import {
  calculateBookingFees,
  calculateStayTotal,
  hasAnyRate,
  normalizeRates,
} from "@/utils/propertyRates";
import { resolveCommissionForProperty } from "@/utils/foundingHost/resolveCommission";
import { buildPricingCommissionFields } from "@/utils/foundingHost/logic";
import { notifyHostNewReservation } from "@/utils/push/webPush";
import { TRAINING_BOOKING_SOURCE } from "@/utils/opsTraining/constants";
import User from "@/models/User";
import {
  resolveEffectiveBookingPolicy,
  snapshotCancellationPolicy,
} from "@/utils/bookings/bookingPolicy";
import {
  buildCreatorBookingFields,
  resolveOptionalPromoAttribution,
  applyGuestPromoDiscount,
} from "@/utils/creators/promoAttribution";
import { upsertCommissionForBooking } from "@/utils/creators/commissionEngine";

/**
 * Create a pending reservation without a payment gateway.
 * Dates are held (pending blocks availability). Host arranges payment offline.
 */
export async function createManualBookingRequest({
  propertyId,
  guestId,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  currency,
  amountHint,
  createdByHost = false,
  status,
  skipEmails = false,
  source,
  promoCode,
}) {
  if (!propertyId || !guestId || !checkIn || !checkOut) {
    return {
      ok: false,
      status: 400,
      error: "Missing booking fields (property, guest, or dates)",
    };
  }

  if (!isValidGuestPhone(guestPhone)) {
    return {
      ok: false,
      status: 400,
      error: "A valid phone number is required so the host can arrange payment",
    };
  }

  const phone = normalizeGuestPhone(guestPhone);

  const property = await Property.findById(propertyId)
    .select("name owner seller_info rates status bookingPolicy")
    .lean();

  if (!property) {
    return { ok: false, status: 404, error: "Property not found" };
  }

  if (String(property.owner) === String(guestId) && !createdByHost) {
    return {
      ok: false,
      status: 403,
      error: "You cannot reserve your own listing",
    };
  }

  if (createdByHost && String(property.owner) === String(guestId)) {
    return {
      ok: false,
      status: 400,
      error: "Use a guest WhatsApp or email — you cannot book this stay as yourself",
    };
  }

  const listingRates = normalizeRates(property.rates);
  if (!hasAnyRate(listingRates)) {
    return {
      ok: false,
      status: 400,
      error: "This listing has no rates configured yet",
    };
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
      status: 409,
      error: validation.error || "Dates are no longer available",
    };
  }

  const stayPricing = calculateStayTotal(
    listingRates,
    availability.customDayRates || [],
    validation.checkIn,
    validation.checkOut,
  );
  if (!stayPricing) {
    return {
      ok: false,
      status: 400,
      error:
        "No rate is set for this stay length. Try different dates or contact the host.",
    };
  }

  const resolved = await resolveCommissionForProperty(property);
  const nights = countNights(validation.checkIn, validation.checkOut);

  const promoResult = await resolveOptionalPromoAttribution({
    propertyId,
    promoCode,
    guestId,
    guestEmail,
    source,
  });
  if (!promoResult.ok) {
    return {
      ok: false,
      status: 400,
      error: promoResult.error || "Invalid promo code",
    };
  }

  const discount = applyGuestPromoDiscount(
    stayPricing.base,
    promoResult.attribution?.guestDiscountRate || 0,
  );
  const pricedBase = discount.discountedBase;
  const { cleaningFee, commission, total: totalUsd } = calculateBookingFees(
    pricedBase,
    { commissionRate: resolved.commissionRate },
  );

  const amount =
    amountHint != null && Number.isFinite(Number(amountHint))
      ? Number(amountHint)
      : totalUsd;
  const currencyCode = (currency || "USD").toUpperCase();

  const bookingStatus =
    createdByHost && status === "confirmed" ? "confirmed" : "pending";

  // Creator commission on the accommodation the guest actually pays
  const creatorFields = buildCreatorBookingFields(
    promoResult.attribution,
    pricedBase,
  );

  let hostDefault = null;
  if (property.owner) {
    const host = await User.findById(property.owner)
      .select("defaultCancellationPolicy")
      .lean();
    hostDefault = host?.defaultCancellationPolicy || null;
  }
  const { policy: effectivePolicy, source: policySource } =
    resolveEffectiveBookingPolicy({
      property,
      hostDefault,
    });
  const cancellationPolicySnapshot = snapshotCancellationPolicy(
    effectivePolicy,
    policySource,
  );

  const booking = await Booking.create({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    guestId: String(guestId),
    guestName: guestName || undefined,
    guestEmail: guestEmail || undefined,
    guestPhone: phone,
    checkIn: validation.checkIn,
    checkOut: validation.checkOut,
    status: bookingStatus,
    paymentMode: PAYMENT_MODE_MANUAL,
    amount,
    currency: currencyCode,
    propertyName: property.name || undefined,
    version: 0,
    ...(source ? { source } : {}),
    ...creatorFields,
    pricingSnapshot: {
      nightlyRate: pricedBase / Math.max(nights, 1),
      accommodationBase: pricedBase,
      accommodationBeforePromo: discount.originalBase,
      cleaningFee,
      total: totalUsd,
      nights,
      currency: "USD",
      ...(discount.guestDiscountAmount > 0
        ? {
            promoCode: promoResult.attribution?.creatorPromoCode,
            promoDiscountRate: discount.guestDiscountRate,
            promoDiscountAmount: discount.guestDiscountAmount,
          }
        : {}),
      ...buildPricingCommissionFields({ commission, resolved }),
    },
    cancellationPolicySnapshot,
  });

  if (creatorFields.creatorAttributionStatus === "attributed") {
    try {
      await upsertCommissionForBooking(booking.toObject(), {
        actor: "booking.create",
      });
    } catch (err) {
      console.error("[creator commission] upsert failed:", err);
    }
  }

  const plain = booking.toObject();

  let push = { sent: 0, skipped: "not-attempted" };
  const shouldNotifyHost =
    Boolean(property.owner) &&
    (source === TRAINING_BOOKING_SOURCE || !createdByHost);
  if (shouldNotifyHost) {
    try {
      push = await notifyHostNewReservation({
        hostUserId: property.owner,
        propertyName: property.name,
        guestName,
        checkIn: validation.checkIn,
        checkOut: validation.checkOut,
        bookingId: String(booking._id),
        status: bookingStatus,
      });
    } catch (err) {
      console.error("[web-push] host notify failed:", err);
      push = { sent: 0, skipped: "send-failed" };
    }
  }

  // Fire-and-forget style: emails should not fail the reservation.
  let emails = null;
  if (skipEmails) {
    return {
      ok: true,
      status: 201,
      booking: plain,
      nights,
      emails: { skipped: true },
      push,
    };
  }

  const host = await resolveHostContact(property);
  try {
    emails = await sendEmailsForBooking(
      plain._id,
      {
        property_id: propertyId,
        property_name: property.name,
        host_id: property.owner,
        host_name: host.hostName || "",
        host_email: host.hostEmail || "",
        check_in: validation.checkIn,
        check_out: validation.checkOut,
        nights,
        amount,
        currency: currencyCode,
        payment_mode: PAYMENT_MODE_MANUAL,
        guest_phone: phone,
      },
      {
        guestId: String(guestId),
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
        guestPhone: phone,
      },
      nights,
    );
  } catch (err) {
    console.error("[manual booking] email dispatch failed:", err);
  }

  return {
    ok: true,
    status: 201,
    booking: plain,
    nights,
    emails,
    push,
  };
}
