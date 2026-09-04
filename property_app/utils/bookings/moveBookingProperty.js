import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import {
  buildUnavailableRanges,
  ensurePropertyAvailability,
  getConfirmedBookings,
} from "@/utils/availability/availabilityService";
import { rangesOverlap } from "@/utils/availability/dateUtils";
import { isPast } from "@/utils/availability/calendarGrid";
import { validateStayDates } from "@/utils/availability/validateStay";
import { evaluateBookingPolicy } from "@/utils/bookings/bookingPolicy";
import { notifyBookingModified } from "@/utils/bookings/notifyBookingEmails";

function asId(value) {
  return value?.toString?.() ?? String(value ?? "");
}

function isListed(booking) {
  return booking?.listed !== false;
}

function overlapCount(bookings, checkIn, checkOut) {
  const stay = { startDate: checkIn, endDate: checkOut };
  return bookings.filter((b) =>
    rangesOverlap(
      { startDate: b.checkIn, endDate: b.checkOut },
      stay,
    ),
  ).length;
}

async function destinationIsFree({
  targetPropertyId,
  checkIn,
  checkOut,
  excludeBookingId,
}) {
  const [availDoc, confirmed] = await Promise.all([
    ensurePropertyAvailability(targetPropertyId),
    getConfirmedBookings(targetPropertyId),
  ]);
  const others = confirmed.filter(
    (b) => asId(b._id) !== asId(excludeBookingId),
  );
  const unavailable = buildUnavailableRanges(
    availDoc.hostBlocks || [],
    others,
  );
  return validateStayDates(checkIn, checkOut, unavailable);
}

async function revertMove({
  bookingId,
  sourcePropertyId,
  sourceName,
  expectedDestId,
}) {
  await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      propertyId: expectedDestId,
    },
    {
      $set: {
        propertyId: sourcePropertyId,
        propertyName: sourceName,
      },
      $inc: { version: 1 },
    },
  );
}

/**
 * Move a listed pending/confirmed stay to another listing the same host owns.
 * Dates stay the same. Occupancy is derived from Booking.propertyId, so the
 * source listing frees those nights and the destination holds them.
 *
 * Does not rewrite host blocks, payments, or message threads.
 */
export async function moveBookingToProperty({
  bookingId,
  targetPropertyId,
  actor,
  actorUserId,
  expectedVersion,
  sourceProperty,
}) {
  if (!mongoose.Types.ObjectId.isValid(String(bookingId))) {
    return { ok: false, status: 400, error: "Invalid booking" };
  }
  if (!mongoose.Types.ObjectId.isValid(String(targetPropertyId))) {
    return { ok: false, status: 400, error: "Invalid destination listing" };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  const sourceId = asId(booking.propertyId);
  const destId = asId(targetPropertyId);
  if (sourceId === destId) {
    return { ok: false, status: 400, error: "Choose a different listing" };
  }

  if (!isListed(booking)) {
    return {
      ok: false,
      status: 400,
      error:
        "Relist this stay on the calendar before moving it to another listing",
    };
  }

  if (isPast(booking.checkIn)) {
    return {
      ok: false,
      status: 400,
      code: "stay_started",
      error:
        "This stay has already started. Move is only available before check-in.",
    };
  }

  const source =
    sourceProperty && asId(sourceProperty._id) === sourceId
      ? sourceProperty
      : await Property.findById(sourceId)
          .select("owner name bookingPolicy seller_info")
          .lean();
  const dest = await Property.findById(destId)
    .select("owner name bookingPolicy seller_info")
    .lean();

  if (!source) {
    return { ok: false, status: 404, error: "Current listing not found" };
  }
  if (!dest) {
    return { ok: false, status: 404, error: "Destination listing not found" };
  }

  const hostId = String(actorUserId || "");
  if (!hostId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  if (asId(source.owner) !== hostId || asId(dest.owner) !== hostId) {
    return {
      ok: false,
      status: 403,
      error: "You can only move a stay between your own listings",
    };
  }

  const decision = evaluateBookingPolicy(
    booking.toObject(),
    source,
    "modify",
    new Date(),
    { actor: actor || "host" },
  );
  if (!decision.allowed) {
    return {
      ok: false,
      status: decision.status || 403,
      error: decision.reason || "This stay cannot be moved",
      code: decision.code,
      policy: decision.policy,
    };
  }

  const fit = await destinationIsFree({
    targetPropertyId: destId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    excludeBookingId: booking._id,
  });
  if (!fit.ok) {
    return {
      ok: false,
      status: 409,
      error:
        fit.error ||
        "Those nights are not free on the destination listing (already booked or blocked).",
    };
  }

  const currentVersion = Number(booking.version) || 0;
  if (
    expectedVersion != null &&
    Number.isFinite(Number(expectedVersion)) &&
    Number(expectedVersion) !== currentVersion
  ) {
    return {
      ok: false,
      status: 409,
      error: "This stay changed while you were moving it. Refresh and try again.",
    };
  }

  const filter = {
    _id: booking._id,
    propertyId: booking.propertyId,
    status: { $in: ["pending", "confirmed"] },
    listed: { $ne: false },
  };

  const moved = await Booking.findOneAndUpdate(
    filter,
    {
      $set: {
        propertyId: dest._id,
        propertyName: dest.name,
        previousPropertyId: source._id,
        previousPropertyName: source.name || booking.propertyName,
        modifiedAt: new Date(),
      },
      $inc: { version: 1, modificationCount: 1 },
    },
    { new: true },
  );

  if (!moved) {
    return {
      ok: false,
      status: 409,
      error: "This stay changed while you were moving it. Refresh and try again.",
    };
  }

  const destBookings = await getConfirmedBookings(destId);
  const held = overlapCount(destBookings, moved.checkIn, moved.checkOut);
  if (held !== 1) {
    await revertMove({
      bookingId: moved._id,
      sourcePropertyId: source._id,
      sourceName: source.name,
      expectedDestId: dest._id,
    });
    return {
      ok: false,
      status: 409,
      error:
        "Those nights were taken on the destination listing. The stay was not moved.",
    };
  }

  const emails = await notifyBookingModified(moved.toObject(), dest, {
    actor: actor || "host",
    previousPropertyName: source.name || booking.propertyName,
  });

  return {
    ok: true,
    booking: moved.toObject(),
    sourceProperty: { id: sourceId, name: source.name },
    destProperty: { id: destId, name: dest.name },
    emails,
  };
}
