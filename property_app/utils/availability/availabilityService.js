import mongoose from "mongoose";
import PropertyAvailability from "@/models/PropertyAvailability";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import {
  rangesOverlap,
  validateRange,
  mergeRanges,
  toDateOnlyString,
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
    startDate: toDateOnlyString(booking.checkIn),
    endDate: toDateOnlyString(booking.checkOut),
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
    return { errors: ["hostBlocks must be an array"], normalized: [] };
  }

  const normalized = [];

  for (let i = 0; i < hostBlocks.length; i++) {
    const block = hostBlocks[i];
    const startDate = toDateOnlyString(block?.startDate);
    const endDate = toDateOnlyString(block?.endDate);
    const rangeErrors = validateRange({ startDate, endDate });
    if (rangeErrors.length) {
      errors.push(`Block ${i + 1}: ${rangeErrors.join(", ")}`);
      continue;
    }
    normalized.push({
      startDate,
      endDate,
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
      const bookingRange = bookingToRange(booking);
      if (!bookingRange.startDate || !bookingRange.endDate) continue;
      if (rangesOverlap(normalized[i], bookingRange)) {
        errors.push(
          `Host block ${i + 1} overlaps confirmed booking (${bookingRange.startDate} – ${bookingRange.endDate})`,
        );
      }
    }
  }

  return { errors, normalized };
}

/**
 * Atomically upsert availability settings (host blocks, defaults, custom rates).
 */
export async function upsertPropertyAvailability(
  propertyId,
  hostId,
  { hostBlocks, defaultAvailability, customDayRates },
) {
  const oid = new mongoose.Types.ObjectId(propertyId);
  const $set = {};

  if (hostId) $set.hostId = hostId;
  if (hostBlocks !== undefined) $set.hostBlocks = hostBlocks;
  if (defaultAvailability !== undefined) $set.defaultAvailability = defaultAvailability;
  if (customDayRates !== undefined) $set.customDayRates = customDayRates;

  return PropertyAvailability.findOneAndUpdate(
    { propertyId: oid },
    {
      $set,
      $setOnInsert: {
        propertyId: oid,
        defaultAvailability: defaultAvailability ?? "open",
        hostBlocks: hostBlocks ?? [],
        customDayRates: customDayRates ?? [],
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

/**
 * Validate host blocks against confirmed bookings, then persist with an atomic upsert.
 */
export async function updatePropertyAvailability(propertyId, hostId, body) {
  const hostBlocks = body.hostBlocks ?? [];
  const defaultAvailability = body.defaultAvailability;
  const customDayRatesInput = body.customDayRates;

  if (
    defaultAvailability != null &&
    defaultAvailability !== "open" &&
    defaultAvailability !== "closed"
  ) {
    return {
      ok: false,
      status: 400,
      error: "defaultAvailability must be 'open' or 'closed'",
    };
  }

  const confirmedBookings = await getConfirmedBookings(propertyId);
  const { errors, normalized } = validateHostBlocks(hostBlocks, confirmedBookings);
  if (errors.length) {
    return { ok: false, status: 400, error: "Validation failed", details: errors };
  }

  let normalizedCustom = undefined;
  if (customDayRatesInput != null) {
    const customResult = validateCustomDayRates(customDayRatesInput);
    if (customResult.errors.length) {
      return {
        ok: false,
        status: 400,
        error: "Validation failed",
        details: customResult.errors,
      };
    }
    normalizedCustom = customResult.normalized;
  }

  const update = { hostBlocks: normalized };
  if (defaultAvailability != null) update.defaultAvailability = defaultAvailability;
  if (normalizedCustom != null) update.customDayRates = normalizedCustom;

  const updated = await upsertPropertyAvailability(propertyId, hostId, update);

  return {
    ok: true,
    payload: formatPutAvailabilityResponse(propertyId, updated, confirmedBookings),
  };
}

function mapHostBlocksForApi(hostBlocks) {
  return (hostBlocks || []).map((b) => ({
    _id: b._id?.toString(),
    startDate: b.startDate,
    endDate: b.endDate,
    note: b.note,
  }));
}

/** PUT response: updated blocks, default availability, and merged calendar view. */
export function formatPutAvailabilityResponse(propertyId, availabilityDoc, confirmedBookings) {
  const hostBlocks = availabilityDoc.hostBlocks || [];
  const defaultAvailability = availabilityDoc.defaultAvailability || "open";
  const customDayRates = normalizeCustomDayRates(availabilityDoc.customDayRates || []);

  return {
    success: true,
    propertyId: String(propertyId),
    hostBlocks: mapHostBlocksForApi(hostBlocks),
    defaultAvailability,
    unavailableRanges: buildUnavailableRanges(hostBlocks, confirmedBookings, {
      includeNotes: true,
    }),
    customDayRates,
    confirmedBookingsCount: confirmedBookings.length,
  };
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
    payload.hostBlocks = mapHostBlocksForApi(hostBlocks);
    payload.confirmedBookingsCount = bookings.length;
  }

  return payload;
}
