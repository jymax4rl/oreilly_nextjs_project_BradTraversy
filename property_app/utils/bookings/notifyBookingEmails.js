import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import { countNights } from "@/utils/availability/validateStay";
import {
  formatPropertyLocation,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";
import {
  sendBookingCancelledEmails,
  sendBookingModifiedEmails,
} from "@/utils/email/sendBookingEmails";

/**
 * Resolve recipients + property email context for a booking mutation.
 * Email failures must never fail the booking API.
 */
async function buildLifecyclePayload(booking, propertyHint) {
  const property =
    propertyHint ||
    (await Property.findById(booking.propertyId)
      .select("name seller_info images location beds baths type owner")
      .lean());

  let hostEmail = property?.seller_info?.email;
  let hostName = property?.seller_info?.name;
  let tx = null;

  if (booking.transactionId != null) {
    tx = await Transaction.findOne({
      transaction_id: booking.transactionId,
    })
      .select("host_email host_name property_name")
      .lean();
    if (tx?.host_email) hostEmail = hostEmail || tx.host_email;
    if (tx?.host_name) hostName = hostName || tx.host_name;
  }

  const locationLabel = property
    ? formatPropertyLocation(property.location)
    : undefined;
  const propertyMeta = property
    ? formatPropertyMeta(property, locationLabel)
    : undefined;

  return {
    guestEmail: booking.guestEmail,
    guestName: booking.guestName,
    hostEmail,
    hostName,
    propertyName:
      booking.propertyName || property?.name || tx?.property_name || "Property",
    propertyId: booking.propertyId?.toString?.() ?? booking.propertyId,
    propertyImageUrl: property
      ? propertyImageAbsoluteUrl(property.images)
      : undefined,
    propertyMeta,
    locationLabel,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: countNights(booking.checkIn, booking.checkOut),
    amount: booking.amount,
    currency: booking.currency,
    transactionId: booking.transactionId,
  };
}

function statusFromResult(sent, hasEmail, sameAsOther) {
  if (!hasEmail || sameAsOther) return "skipped";
  return sent ? "sent" : "failed";
}

/**
 * After dates change — email guest + host. Never throws to callers.
 */
export async function notifyBookingModified(booking, property, { actor } = {}) {
  try {
    const payload = await buildLifecyclePayload(booking, property);
    payload.previousCheckIn = booking.previousCheckIn;
    payload.previousCheckOut = booking.previousCheckOut;
    payload.changedBy = actor || "guest";
    payload.idempotencySuffix = `mod-${booking.modificationCount || 1}-${Date.now()}`;

    const outcome = await sendBookingModifiedEmails(payload);

    if (!outcome?.enabled) {
      console.warn("[booking email] Modify notify skipped:", outcome?.error);
      return { attempted: false, configError: outcome?.error };
    }

    const guestStatus = statusFromResult(
      outcome.results?.guest?.sent,
      Boolean(payload.guestEmail),
      false,
    );
    const hostStatus = statusFromResult(
      outcome.results?.host?.sent,
      Boolean(payload.hostEmail),
      payload.hostEmail === payload.guestEmail,
    );

    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        "emailStatus.modifiedGuest": guestStatus,
        "emailStatus.modifiedHost": hostStatus,
      },
    }).catch(() => {});

    console.info("[booking email] Modify notify", {
      bookingId: String(booking._id),
      guestStatus,
      hostStatus,
    });

    return {
      attempted: true,
      guestStatus,
      hostStatus,
      results: outcome.results,
    };
  } catch (err) {
    console.error("[booking email] Modify notify error:", err);
    return { attempted: true, error: err.message || String(err) };
  }
}

/**
 * After cancel — email guest + host. Never throws to callers.
 */
export async function notifyBookingCancelled(
  booking,
  property,
  { actor, reason, refundEligible } = {},
) {
  try {
    const payload = await buildLifecyclePayload(booking, property);
    payload.cancelledBy = actor || "guest";
    payload.cancellationReason = reason || booking.cancellationReason;
    payload.refundEligible = Boolean(refundEligible);
    payload.idempotencySuffix = `cancel-${Date.now()}`;

    const outcome = await sendBookingCancelledEmails(payload);

    if (!outcome?.enabled) {
      console.warn("[booking email] Cancel notify skipped:", outcome?.error);
      return { attempted: false, configError: outcome?.error };
    }

    const guestStatus = statusFromResult(
      outcome.results?.guest?.sent,
      Boolean(payload.guestEmail),
      false,
    );
    const hostStatus = statusFromResult(
      outcome.results?.host?.sent,
      Boolean(payload.hostEmail),
      payload.hostEmail === payload.guestEmail,
    );

    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        "emailStatus.cancelledGuest": guestStatus,
        "emailStatus.cancelledHost": hostStatus,
      },
    }).catch(() => {});

    console.info("[booking email] Cancel notify", {
      bookingId: String(booking._id),
      guestStatus,
      hostStatus,
    });

    return {
      attempted: true,
      guestStatus,
      hostStatus,
      results: outcome.results,
    };
  } catch (err) {
    console.error("[booking email] Cancel notify error:", err);
    return { attempted: true, error: err.message || String(err) };
  }
}
