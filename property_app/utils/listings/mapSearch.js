import mongoose from "mongoose";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import PropertyAvailability from "@/models/PropertyAvailability";
import {
  buildCatalogMongoQuery,
  parseCatalogSearchParams,
} from "@/utils/listings/catalogQuery";
import { buildUnavailableRanges } from "@/utils/availability/availabilityService";
import { validateStayDates, countNights } from "@/utils/availability/validateStay";
import {
  calculateStayTotal,
  getDefaultNightlyUsd,
  getPrimaryDisplayRate,
} from "@/utils/propertyRates";
import { propertyCardImageUrl } from "@/utils/propertyImageUrl";
import { coerceCoordinate } from "@/utils/address";

function propertyIdKey(id) {
  return String(id);
}

/**
 * Batch availability filter for a candidate set (server-side).
 * Uses existing booking + host-block semantics ([checkIn, checkOut)).
 */
async function filterAvailableForStay(properties, checkIn, checkOut) {
  if (!checkIn || !checkOut || !properties.length) {
    return { available: properties, customRatesByProperty: new Map() };
  }

  const validationShape = validateStayDates(checkIn, checkOut, []);
  if (!validationShape.ok && validationShape.error?.includes("past")) {
    return { available: [], customRatesByProperty: new Map() };
  }
  if (!validationShape.ok && !validationShape.error?.includes("booked")) {
    // Invalid date shape — treat as no date filter rather than empty map.
    if (
      validationShape.error === "Select check-in and check-out dates" ||
      validationShape.error === "Invalid dates" ||
      validationShape.error === "Check-out must be after check-in"
    ) {
      return { available: properties, customRatesByProperty: new Map() };
    }
  }

  const oids = properties
    .map((p) => p._id)
    .filter(Boolean)
    .map((id) =>
      mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : null,
    )
    .filter(Boolean);

  const [bookings, availDocs] = await Promise.all([
    Booking.find({
      propertyId: { $in: oids },
      status: { $in: ["confirmed", "pending"] },
      listed: { $ne: false },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    })
      .select("propertyId checkIn checkOut")
      .lean(),
    PropertyAvailability.find({ propertyId: { $in: oids } })
      .select("propertyId hostBlocks customDayRates")
      .lean(),
  ]);

  const bookingsByProp = new Map();
  for (const b of bookings) {
    const key = propertyIdKey(b.propertyId);
    if (!bookingsByProp.has(key)) bookingsByProp.set(key, []);
    bookingsByProp.get(key).push(b);
  }

  const availByProp = new Map();
  for (const doc of availDocs) {
    availByProp.set(propertyIdKey(doc.propertyId), doc);
  }

  const customRatesByProperty = new Map();
  const available = [];

  for (const property of properties) {
    const key = propertyIdKey(property._id);
    const doc = availByProp.get(key);
    const propBookings = bookingsByProp.get(key) || [];
    const hostBlocks = doc?.hostBlocks || [];
    const unavailableRanges = buildUnavailableRanges(hostBlocks, propBookings);
    const result = validateStayDates(checkIn, checkOut, unavailableRanges);
    if (!result.ok) continue;
    customRatesByProperty.set(key, doc?.customDayRates || []);
    available.push(property);
  }

  return { available, customRatesByProperty };
}

function resolveMarkerPriceUsd(property, checkIn, checkOut, customDayRates) {
  if (checkIn && checkOut) {
    const stay = calculateStayTotal(
      property.rates,
      customDayRates || [],
      checkIn,
      checkOut,
    );
    const nights = countNights(checkIn, checkOut);
    if (stay?.base != null && nights > 0) {
      return {
        amountUsd: Math.round((stay.base / nights) * 100) / 100,
        stayTotalUsd: stay.base,
        nights,
        basis: "nightly_avg",
      };
    }
  }

  const nightly = getDefaultNightlyUsd(property.rates);
  if (nightly != null) {
    return { amountUsd: nightly, stayTotalUsd: null, nights: null, basis: "nightly" };
  }
  if (property.listingPrice != null && Number.isFinite(Number(property.listingPrice))) {
    return {
      amountUsd: Number(property.listingPrice),
      stayTotalUsd: null,
      nights: null,
      basis: "listingPrice",
    };
  }
  const primary = getPrimaryDisplayRate(property.rates);
  if (primary?.amount != null) {
    return {
      amountUsd: primary.amount,
      stayTotalUsd: null,
      nights: null,
      basis: primary.basis,
    };
  }
  return { amountUsd: null, stayTotalUsd: null, nights: null, basis: null };
}

function toMapPin(property, priceInfo) {
  const lat = coerceCoordinate(property.location?.lat);
  const lng = coerceCoordinate(property.location?.lng);
  if (lat == null || lng == null) return null;

  const images = Array.isArray(property.images) ? property.images : [];
  return {
    id: String(property._id),
    slug: property.slug || null,
    title: property.name || "Stay",
    lat,
    lng,
    approximate: property.location?.showExactLocation !== true,
    priceUsd: priceInfo.amountUsd,
    stayTotalUsd: priceInfo.stayTotalUsd,
    nights: priceInfo.nights,
    priceBasis: priceInfo.basis,
    beds: property.beds ?? null,
    baths: property.baths ?? null,
    type: property.type || null,
    city: property.location?.city || "",
    country: property.location?.country || "",
    thumbnail: propertyCardImageUrl(images) || null,
    rates: property.rates || null,
    listingPrice: property.listingPrice ?? null,
  };
}

/**
 * Server-side map/search query: bounds + filters + optional availability.
 */
export async function searchMapProperties(rawParams) {
  const params =
    typeof rawParams?.get === "function"
      ? parseCatalogSearchParams(rawParams)
      : parseCatalogSearchParams({
          get: (key) => rawParams?.[key],
        });

  if (!params.bounds) {
    return {
      ok: false,
      status: 400,
      error: "Valid map bounds (north, south, east, west) are required",
    };
  }

  const mongoQuery = buildCatalogMongoQuery({
    location: params.location,
    type: params.type,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minBeds: params.minBeds,
    minBaths: params.minBaths,
    bounds: params.bounds,
    requireCoordinates: true,
  });

  // Over-fetch slightly before availability filtering.
  const fetchLimit = Math.min(params.limit * 2, 200);
  const candidates = await Property.find(mongoQuery)
    .select(
      "_id slug name type beds baths listingPrice rates images location.lat location.lng location.city location.country location.showExactLocation",
    )
    .limit(fetchLimit)
    .lean();

  const { available, customRatesByProperty } = await filterAvailableForStay(
    candidates,
    params.checkIn,
    params.checkOut,
  );

  const pins = [];
  for (const property of available) {
    if (pins.length >= params.limit) break;
    const key = propertyIdKey(property._id);
    const priceInfo = resolveMarkerPriceUsd(
      property,
      params.checkIn,
      params.checkOut,
      customRatesByProperty.get(key),
    );

    // Re-apply nightly price filter against date-aware average when dates set.
    if (params.checkIn && params.checkOut && priceInfo.amountUsd != null) {
      if (params.minPrice != null && priceInfo.amountUsd < params.minPrice) {
        continue;
      }
      if (params.maxPrice != null && priceInfo.amountUsd > params.maxPrice) {
        continue;
      }
    }

    const pin = toMapPin(property, priceInfo);
    if (pin) pins.push(pin);
  }

  return {
    ok: true,
    pins,
    count: pins.length,
    truncated: candidates.length >= fetchLimit,
    bounds: params.bounds,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  };
}
