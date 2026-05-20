import Booking from "@/models/Booking";
import BookingEvent from "@/models/BookingEvent";
import {
  canCancelBooking,
  bookingActionFlags,
} from "@/utils/bookings/bookingPolicy";
import {
  loadBookingWithProperty,
  assertGuestOwnership,
  assertHostOwnership,
  hostContactFromProperty,
} from "@/utils/bookings/loadBookingContext";
import { runWithTransaction } from "@/utils/bookings/runWithTransaction";
import { sendBookingCancelledEmails } from "@/utils/email/sendBookingLifecycleEmails";

async function recordCancelEvent(session, bookingId, actorId, actorRole, payload) {
  await BookingEvent.create(
    [
      {
        bookingId,
        type: "cancelled",
        actorId,
        actorRole,
        payload,
      },
    ],
    session ? { session } : undefined,
  );
}

export async function cancelBooking({
  bookingId,
  actorId,
  actorRole,
  reason,
  expectedVersion,
}) {
  const ctx = await loadBookingWithProperty(bookingId);
  if (!ctx?.booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  const { booking, property } = ctx;

  if (actorRole === "guest") {
    const owned = assertGuestOwnership(booking, actorId);
    if (!owned.ok) return { ok: false, status: owned.status, error: owned.error };
  } else if (actorRole === "host") {
    const owned = assertHostOwnership(property, actorId);
    if (!owned.ok) return { ok: false, status: owned.status, error: owned.error };
  } else {
    return { ok: false, status: 403, error: "Invalid actor role" };
  }

  const policy = canCancelBooking(booking);
  if (!policy.ok) {
    return { ok: false, status: 400, error: policy.reason };
  }

  const version =
    expectedVersion != null ? Number(expectedVersion) : Number(booking.version ?? 0);

  const cancelPayload = {
    status: "cancelled",
    cancelledAt: new Date(),
    cancelledBy: String(actorId),
    cancellationReason:
      typeof reason === "string" ? reason.trim().slice(0, 500) : undefined,
    refundStatus: policy.refundEligible ? "none" : "none",
  };

  const updated = await runWithTransaction(async (session) => {
    const opts = { new: true, session: session || undefined };
    const doc = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: "confirmed",
        version,
      },
      {
        $set: cancelPayload,
        $inc: { version: 1 },
      },
      opts,
    );

    if (!doc) {
      return null;
    }

    await recordCancelEvent(session, doc._id, actorId, actorRole, {
      checkIn: doc.checkIn,
      checkOut: doc.checkOut,
      reason: cancelPayload.cancellationReason,
      refundEligible: policy.refundEligible,
    });

    return doc;
  });

  if (!updated) {
    const current = await Booking.findById(booking._id).lean();
    if (current?.status === "cancelled") {
      return {
        ok: false,
        status: 409,
        error: "Booking is already cancelled",
        code: "ALREADY_CANCELLED",
      };
    }
    return {
      ok: false,
      status: 409,
      error: "Booking was updated elsewhere. Refresh and try again.",
      code: "VERSION_CONFLICT",
    };
  }

  const host = hostContactFromProperty(property);
  const emailResults = await sendBookingCancelledEmails({
    booking: updated.toObject(),
    property,
    guestEmail: updated.guestEmail,
    guestName: updated.guestName,
    hostEmail: host.hostEmail,
    hostName: host.hostName,
    cancelledBy: actorRole,
    refundLabel: policy.refundLabel,
  });

  await Booking.updateOne(
    { _id: updated._id },
    {
      $set: {
        "emailStatus.cancelledGuest": emailResults.results?.guest?.sent
          ? "sent"
          : emailResults.enabled
            ? "failed"
            : "skipped",
        "emailStatus.cancelledHost": emailResults.results?.host?.sent
          ? "sent"
          : emailResults.enabled
            ? "failed"
            : "skipped",
      },
    },
  );

  const flags = bookingActionFlags(updated.toObject());

  return {
    ok: true,
    booking: {
      _id: updated._id.toString(),
      propertyId: String(updated.propertyId),
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      status: updated.status,
      version: updated.version,
      cancelledAt: updated.cancelledAt,
      refundEligible: policy.refundEligible,
      refundLabel: policy.refundLabel,
      ...flags,
    },
    emailResults,
  };
}
