import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import {
  buildUnavailableRanges,
  ensurePropertyAvailability,
  getConfirmedBookings,
} from "@/utils/availability/availabilityService";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";
import { evaluateBookingPolicy } from "@/utils/bookings/bookingPolicy";
import {
  notifyBookingCancelled,
  notifyBookingModified,
} from "@/utils/bookings/notifyBookingEmails";

/**
 * Cancel a booking after policy + auth checks (caller supplies actor).
 * Does not process payment refunds — sets refundStatus pending when eligible.
 */
export async function cancelBookingRecord({
  bookingId,
  actor,
  actorUserId,
  reason,
  property,
}) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  const prop =
    property ||
    (await Property.findById(booking.propertyId)
      .select("owner bookingPolicy seller_info name")
      .lean());

  const decision = evaluateBookingPolicy(
    booking.toObject(),
    prop,
    "cancel",
    new Date(),
    { actor },
  );

  if (!decision.allowed) {
    return {
      ok: false,
      status: 403,
      error: decision.reason || "Cancellation not allowed",
      code: decision.code,
      policy: decision.policy,
    };
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = `${actor}:${actorUserId || "unknown"}`;
  if (reason) {
    booking.cancellationReason = String(reason).slice(0, 500);
  }
  if (decision.refundEligible && booking.refundStatus === "none") {
    booking.refundStatus = "pending";
  }
  booking.version = (booking.version || 0) + 1;
  await booking.save();

  const emails = await notifyBookingCancelled(booking.toObject(), prop, {
    actor,
    reason: reason || booking.cancellationReason,
    refundEligible: decision.refundEligible,
  });

  return {
    ok: true,
    booking: booking.toObject(),
    policy: decision.policy,
    refundEligible: decision.refundEligible,
    emails,
  };
}

/**
 * Modify stay dates after policy + availability checks.
 * Excludes the current booking's nights from conflict detection.
 */
export async function modifyBookingDates({
  bookingId,
  actor,
  checkIn,
  checkOut,
  property,
}) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  const prop =
    property ||
    (await Property.findById(booking.propertyId)
      .select("owner bookingPolicy seller_info name")
      .lean());

  const decision = evaluateBookingPolicy(
    booking.toObject(),
    prop,
    "modify",
    new Date(),
    { actor },
  );

  if (!decision.allowed) {
    return {
      ok: false,
      status: 403,
      error: decision.reason || "Modification not allowed",
      code: decision.code,
      policy: decision.policy,
    };
  }

  // Exclude this booking so guests/hosts can shrink or shift within their own stay.
  const propertyId = booking.propertyId.toString();
  const [availDoc, confirmed] = await Promise.all([
    ensurePropertyAvailability(propertyId),
    getConfirmedBookings(propertyId),
  ]);
  const otherBookings = confirmed.filter(
    (b) => String(b._id) !== String(booking._id),
  );
  const unavailable = buildUnavailableRanges(
    availDoc.hostBlocks || [],
    otherBookings,
  );

  const validation = validateStayDates(checkIn, checkOut, unavailable);
  if (!validation.ok) {
    return {
      ok: false,
      status: 400,
      error: validation.error || "Invalid dates",
    };
  }

  booking.previousCheckIn = booking.checkIn;
  booking.previousCheckOut = booking.checkOut;
  booking.checkIn = validation.checkIn;
  booking.checkOut = validation.checkOut;
  booking.modifiedAt = new Date();
  booking.modificationCount = (booking.modificationCount || 0) + 1;
  booking.version = (booking.version || 0) + 1;

  if (booking.pricingSnapshot) {
    booking.pricingSnapshot.nights = countNights(
      validation.checkIn,
      validation.checkOut,
    );
  }

  await booking.save();

  const emails = await notifyBookingModified(booking.toObject(), prop, {
    actor,
  });

  return {
    ok: true,
    booking: booking.toObject(),
    policy: decision.policy,
    nights: countNights(validation.checkIn, validation.checkOut),
    emails,
  };
}

/**
 * Serialize booking for API/UI with policy flags for an actor.
 */
export function bookingWithPolicyFlags(booking, property, actor = "guest") {
  const plain =
    typeof booking.toObject === "function" ? booking.toObject() : booking;
  const cancel = evaluateBookingPolicy(plain, property, "cancel", new Date(), {
    actor,
  });
  const modify = evaluateBookingPolicy(plain, property, "modify", new Date(), {
    actor,
  });
  const resend = evaluateBookingPolicy(plain, property, "resend", new Date(), {
    actor,
  });

  return {
    _id: plain._id?.toString?.() ?? String(plain._id),
    propertyId: plain.propertyId?.toString?.() ?? String(plain.propertyId),
    checkIn: plain.checkIn,
    checkOut: plain.checkOut,
    status: plain.status,
    guestId: plain.guestId,
    guestName: plain.guestName,
    guestEmail: plain.guestEmail,
    transactionId: plain.transactionId,
    propertyName: plain.propertyName,
    amount: plain.amount,
    currency: plain.currency,
    modificationCount: plain.modificationCount || 0,
    cancelledAt: plain.cancelledAt,
    modifiedAt: plain.modifiedAt,
    refundStatus: plain.refundStatus,
    emailStatus: plain.emailStatus,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    actions: {
      cancel: {
        allowed: cancel.allowed,
        reason: cancel.reason || null,
        code: cancel.code || null,
      },
      modify: {
        allowed: modify.allowed,
        reason: modify.reason || null,
        code: modify.code || null,
      },
      resend: {
        allowed: resend.allowed,
        reason: resend.reason || null,
        code: resend.code || null,
      },
    },
    policy: cancel.policy,
  };
}

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
