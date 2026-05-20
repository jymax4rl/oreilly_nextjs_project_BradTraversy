import mongoose from "mongoose";
import PropertyAvailability from "@/models/PropertyAvailability";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import {
  rangesOverlap,
  validateRange,
  mergeRanges,
} from "@/utils/availability/dateUtils";
import {
  normalizeCustomDayRates,
  validateCustomDayRates,
} from "@/utils/availability/customDayRates";

async function resolveHostId(propertyId) {
  const property = await Property.findById(propertyId).select("owner").lean();
  return property?.owner || undefined;
}

/**
 * One doc per property. `hostId` = property owner's user id (from Property.owner).
 * `hostBlocks` = date ranges the host blocked (unchanged).
 */
export async function ensurePropertyAvailability(propertyId, hostIdHint) {
  const oid = new mongoose.Types.ObjectId(propertyId);
  let doc = await PropertyAvailability.findOne({ propertyId: oid });

  const hostId = hostIdHint || doc?.hostId || (await resolveHostId(propertyId));

  if (!doc) {
    return PropertyAvailability.create({
      propertyId: oid,
      hostId,
      defaultAvailability: "open",
      hostBlocks: [],
      customDayRates: [],
    });
  }

  if (hostId && doc.hostId !== hostId) {
    doc.hostId = hostId;
    await doc.save();
  }

  return doc;
}

export { validateCustomDayRates };

export async function getConfirmedBookings(propertyId) {
  return Booking.find({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    status: "confirmed",
  })
    .sort({ checkIn: 1 })
    .lean();
}

function bookingToRange(booking) {
  return {
    startDate: booking.checkIn,
    endDate: booking.checkOut,
    source: "booking",
  };
}

function hostBlockToRange(block) {
  return {
    startDate: block.startDate,
    endDate: block.endDate,
    source: "host",
    note: block.note,
  };
}

export function buildUnavailableRanges(hostBlocks, bookings, { includeNotes = false } = {}) {
  const fromBookings = bookings.map(bookingToRange);
  const fromHost = hostBlocks.map((b) => {
    const r = hostBlockToRange(b);
    if (!includeNotes) delete r.note;
    return r;
  });
  return mergeRanges([...fromBookings, ...fromHost]);
}

export function validateHostBlocks(hostBlocks, confirmedBookings) {
  const errors = [];

  if (!Array.isArray(hostBlocks)) {
    return ["hostBlocks must be an array"];
  }

  const normalized = [];

  for (let i = 0; i < hostBlocks.length; i++) {
    const block = hostBlocks[i];
    const rangeErrors = validateRange(block);
    if (rangeErrors.length) {
      errors.push(`Block ${i + 1}: ${rangeErrors.join(", ")}`);
      continue;
    }
    normalized.push({
      startDate: block.startDate,
      endDate: block.endDate,
      note: typeof block.note === "string" ? block.note.trim().slice(0, 500) : undefined,
    });
  }

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      if (rangesOverlap(normalized[i], normalized[j])) {
        errors.push(`Host blocks ${i + 1} and ${j + 1} overlap`);
      }
    }
  }

  for (let i = 0; i < normalized.length; i++) {
    for (const booking of confirmedBookings) {
      if (rangesOverlap(normalized[i], bookingToRange(booking))) {
        errors.push(
          `Host block ${i + 1} overlaps confirmed booking (${booking.checkIn} – ${booking.checkOut})`,
        );
      }
    }
  }

  return { errors, normalized };
}

export async function getAvailabilityPayload(propertyId, { isOwner = false } = {}) {
  const availability = await ensurePropertyAvailability(propertyId);
  const bookings = await getConfirmedBookings(propertyId);

  const hostBlocks = availability.hostBlocks || [];
  const unavailableRanges = buildUnavailableRanges(hostBlocks, bookings, {
    includeNotes: isOwner,
  });

  const customDayRates = normalizeCustomDayRates(availability.customDayRates || []);

  const payload = {
    propertyId: String(propertyId),
    defaultAvailability: availability.defaultAvailability || "open",
    unavailableRanges,
    customDayRates,
  };

  if (isOwner) {
    payload.hostBlocks = hostBlocks.map((b) => ({
      _id: b._id?.toString(),
      startDate: b.startDate,
      endDate: b.endDate,
      note: b.note,
    }));
    payload.confirmedBookingsCount = bookings.length;
  }

  return payload;
}
