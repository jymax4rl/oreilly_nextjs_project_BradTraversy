import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import { countNights } from "@/utils/availability/validateStay";
import { resolveHostContact } from "@/utils/email/resolveHostContact";
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

  let tx = null;

  if (booking.transactionId != null) {
    tx = await Transaction.findOne({
      transaction_id: booking.transactionId,
    })
      .select("host_email host_name property_name")
      .lean();
  }

  const host = await resolveHostContact(property, {
    host_email: tx?.host_email,
    host_name: tx?.host_name,
  });
  const hostEmail = host.hostEmail;
  const hostName = host.hostName;

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
    bookingId: booking._id ? String(booking._id) : undefined,
  };
}

function statusFromResult(result, hasEmail, sameAsOther) {
  if (!hasEmail || sameAsOther) return "skipped";
  if (result?.reason === "opted_out" || result?.skipped) {
    return result?.reason === "opted_out" ? "opted_out" : "skipped";
  }
  return result?.sent ? "sent" : "failed";
}

/**
 * After dates change — email guest + host. Never throws to callers.
 * `previousPropertyName` means the stay was moved to a different listing.
 */
export async function notifyBookingModified(
  booking,
  property,
  { actor, previousPropertyName } = {},
) {
  try {
    const payload = await buildLifecyclePayload(booking, property);
    payload.previousCheckIn = booking.previousCheckIn;
    payload.previousCheckOut = booking.previousCheckOut;
    payload.previousPropertyName =
      previousPropertyName || booking.previousPropertyName || null;
    payload.changedBy = actor || "guest";
    payload.idempotencySuffix = `mod-${booking.modificationCount || 1}-${Date.now()}`;

    const outcome = await sendBookingModifiedEmails(payload);

    if (!outcome?.enabled) {
      console.warn("[booking email] Modify notify skipped:", outcome?.error);
      return { attempted: false, configError: outcome?.error };
    }

    const guestStatus = statusFromResult(
      outcome.results?.guest,
      Boolean(payload.guestEmail),
      false,
    );
    const hostStatus = statusFromResult(
      outcome.results?.host,
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
      outcome.results?.guest,
      Boolean(payload.guestEmail),
      false,
    );
    const hostStatus = statusFromResult(
      outcome.results?.host,
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
