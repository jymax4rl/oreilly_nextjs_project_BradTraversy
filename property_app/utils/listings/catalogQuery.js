import { withApprovedListingFilter } from "@/utils/listingApproval";
import { applyLatLngBounds, parseMapBounds, parseOptionalNumber } from "@/utils/listings/mapBounds";
import { buildLocationOrClauses } from "@/utils/listings/suggestSearch";

/**
 * Shared catalog Mongo filter for SSR `/properties` and map search API.
 * Prices are USD nightly (listingPrice / rates.nightly).
 */

export { parseOptionalNumber };

export function parsePositiveInt(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function parseDateOnlyParam(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/**
 * @param {object} params
 * @param {string} [params.location]
 * @param {string} [params.type]
 * @param {number|null} [params.minPrice]
 * @param {number|null} [params.maxPrice]
 * @param {number|null} [params.minBeds]
 * @param {number|null} [params.minBaths]
 * @param {boolean} [params.requireCoordinates] — map queries only
 * @param {{ north:number, south:number, east:number, west:number }|null} [params.bounds]
 */
export function buildCatalogMongoQuery(params = {}) {
  const locationQuery = String(params.location || "").trim();
  const typeQuery = params.type;
  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const minBeds = params.minBeds;
  const minBaths = params.minBaths;
  const bounds = params.bounds || null;
  const requireCoordinates = Boolean(params.requireCoordinates);

  const mongoQuery = {};

  if (locationQuery) {
    const locationOr = buildLocationOrClauses(locationQuery);
    if (locationOr?.length) {
      mongoQuery.$or = locationOr;
    }
  }

  if (typeQuery && typeQuery !== "All Properties") {
    mongoQuery.type = { $regex: new RegExp(String(typeQuery), "i") };
  }

  if (minPrice != null || maxPrice != null) {
    const priceCond = {};
    if (minPrice != null && !Number.isNaN(minPrice)) priceCond.$gte = minPrice;
    if (maxPrice != null && !Number.isNaN(maxPrice)) priceCond.$lte = maxPrice;
    if (Object.keys(priceCond).length) {
      mongoQuery.$and = mongoQuery.$and || [];
      mongoQuery.$and.push({
        $or: [
          { listingPrice: priceCond },
          {
            listingPrice: { $exists: false },
            "rates.nightly": priceCond,
          },
        ],
      });
    }
  }

  if (minBeds != null) mongoQuery.beds = { $gte: minBeds };
  if (minBaths != null) mongoQuery.baths = { $gte: minBaths };

  const hasFilters = Boolean(
    locationQuery ||
      (typeQuery && typeQuery !== "All Properties") ||
      minPrice != null ||
      maxPrice != null ||
      minBeds != null ||
      minBaths != null ||
      bounds,
  );
  // Preserve existing browse quirk: unfiltered catalog excludes featured.
  if (!hasFilters) {
    mongoQuery.is_featured = false;
  }

  if (requireCoordinates || bounds) {
    mongoQuery["location.lat"] = {
      ...(mongoQuery["location.lat"] || {}),
      $type: "number",
    };
    mongoQuery["location.lng"] = {
      ...(mongoQuery["location.lng"] || {}),
      $type: "number",
    };
  }

  if (bounds) {
    applyLatLngBounds(mongoQuery, bounds);
  }

  return withApprovedListingFilter(mongoQuery);
}

/**
 * Parse map/catalog search params from a URLSearchParams-like object.
 */
export function parseCatalogSearchParams(searchParams) {
  const sp = searchParams || {};
  const get = (key) => {
    if (typeof sp.get === "function") return sp.get(key);
    return sp[key];
  };

  const bounds = parseMapBounds({
    north: get("north"),
    south: get("south"),
    east: get("east"),
    west: get("west"),
  });

  return {
    location: String(get("location") || "").trim(),
    type: get("type") || "",
    minPrice: parseOptionalNumber(get("minPrice")),
    maxPrice: parseOptionalNumber(get("maxPrice")),
    minBeds: parsePositiveInt(get("minBeds")),
    minBaths: parsePositiveInt(get("minBaths")),
    checkIn: parseDateOnlyParam(get("checkIn")),
    checkOut: parseDateOnlyParam(get("checkOut")),
    guests: parsePositiveInt(get("guests")),
    bounds,
    limit: Math.min(Math.max(parsePositiveInt(get("limit")) || 80, 1), 120),
  };
}
