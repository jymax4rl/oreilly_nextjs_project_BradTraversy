import Booking from "@/models/Booking";
import BookingEvent from "@/models/BookingEvent";
import { canModifyBooking, bookingActionFlags } from "@/utils/bookings/bookingPolicy";
import {
  loadBookingWithProperty,
  assertGuestOwnership,
} from "@/utils/bookings/loadBookingContext";
import { runWithTransaction } from "@/utils/bookings/runWithTransaction";
import { getUnavailableRangesForProperty } from "@/utils/availability/availabilityService";
import { validateStayDates, countNights } from "@/utils/availability/validateStay";
import { buildPricingSnapshot } from "@/utils/bookings/bookingPricing";
import { sendBookingModifiedEmails } from "@/utils/email/sendBookingLifecycleEmails";
import { hostContactFromProperty } from "@/utils/bookings/loadBookingContext";

async function recordModifyEvent(session, bookingId, actorId, payload) {
  await BookingEvent.create(
    [
      {
        bookingId,
        type: "modified",
        actorId,
        actorRole: "guest",
        payload,
      },
    ],
    session ? { session } : undefined,
  );
}

export async function modifyBooking({
  bookingId,
  guestId,
  checkIn,
  checkOut,
  expectedVersion,
}) {
  const ctx = await loadBookingWithProperty(bookingId);
  if (!ctx?.booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  const { booking, property } = ctx;

  const owned = assertGuestOwnership(booking, guestId);
  if (!owned.ok) {
    return { ok: false, status: owned.status, error: owned.error };
  }

  const policy = canModifyBooking(booking);
  if (!policy.ok) {
    return { ok: false, status: 400, error: policy.reason };
  }

  const unavailableRanges = await getUnavailableRangesForProperty(
    String(booking.propertyId),
    { excludeBookingId: booking._id },
  );

  const validation = validateStayDates(checkIn, checkOut, unavailableRanges);
  if (!validation.ok) {
    return { ok: false, status: 400, error: validation.error };
  }

  if (
    validation.checkIn === booking.checkIn &&
    validation.checkOut === booking.checkOut
  ) {
    return { ok: false, status: 400, error: "Select different dates to modify" };
  }

  const pricingSnapshot = property?.rates
    ? await buildPricingSnapshot(
        String(booking.propertyId),
        property.rates,
        validation.checkIn,
        validation.checkOut,
      )
    : null;

  const version =
    expectedVersion != null ? Number(expectedVersion) : Number(booking.version ?? 0);

  const previousStay = {
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    amount: booking.amount,
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
        $set: {
          checkIn: validation.checkIn,
          checkOut: validation.checkOut,
          modifiedAt: new Date(),
          previousCheckIn: booking.checkIn,
          previousCheckOut: booking.checkOut,
          ...(pricingSnapshot
            ? {
                amount: pricingSnapshot.total,
                currency: pricingSnapshot.currency || booking.currency,
                pricingSnapshot,
              }
            : {}),
        },
        $inc: { version: 1, modificationCount: 1 },
      },
      opts,
    );

    if (!doc) {
      return null;
    }

    await recordModifyEvent(session, doc._id, guestId, {
      previous: previousStay,
      next: {
        checkIn: doc.checkIn,
        checkOut: doc.checkOut,
        amount: doc.amount,
      },
    });

    return doc;
  });

  if (!updated) {
    return {
      ok: false,
      status: 409,
      error: "Booking was updated elsewhere. Refresh and try again.",
      code: "VERSION_CONFLICT",
    };
  }

  const host = hostContactFromProperty(property);
  const nights = countNights(updated.checkIn, updated.checkOut);
  const emailResults = await sendBookingModifiedEmails({
    booking: updated.toObject(),
    property,
    guestEmail: updated.guestEmail,
    guestName: updated.guestName,
    hostEmail: host.hostEmail,
    hostName: host.hostName,
    previousCheckIn: previousStay.checkIn,
    previousCheckOut: previousStay.checkOut,
    checkIn: updated.checkIn,
    checkOut: updated.checkOut,
    nights,
    amount: updated.amount,
    currency: updated.currency,
    priceDelta:
      previousStay.amount != null && updated.amount != null
        ? Math.round((updated.amount - previousStay.amount) * 100) / 100
        : null,
  });

  await Booking.updateOne(
    { _id: updated._id },
    {
      $set: {
        "emailStatus.modifiedGuest": emailResults.results?.guest?.sent
          ? "sent"
          : emailResults.enabled
            ? "failed"
            : "skipped",
        "emailStatus.modifiedHost": emailResults.results?.host?.sent
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
      amount: updated.amount,
      currency: updated.currency,
      modificationCount: updated.modificationCount,
      ...flags,
    },
    priceDelta:
      previousStay.amount != null && updated.amount != null
        ? Math.round((updated.amount - previousStay.amount) * 100) / 100
        : null,
    emailResults,
  };
}
