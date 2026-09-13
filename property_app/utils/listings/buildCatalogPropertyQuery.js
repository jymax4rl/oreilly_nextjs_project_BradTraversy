/**
 * Shared Mongo filters for the public property catalog.
 * Matches query params used by /properties (web) and GET /api/properties (Expo).
 *
 * Supported params: location, type, minPrice, maxPrice, minBeds, minBaths,
 * plus optional city / country (case-insensitive substring on those fields).
 */

function parsePositiveInt(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function parseOptionalNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {Record<string, string|null|undefined>|URLSearchParams|object} params
 * @param {{ excludeFeaturedWhenUnfiltered?: boolean }} [options]
 *   Web browse historically hides featured rows when no filters are applied
 *   (featured carousel lives elsewhere). Public REST defaults to including all.
 * @returns {{ mongoQuery: object, filters: object, hasFilters: boolean }}
 */
export function buildCatalogPropertyQuery(params = {}, options = {}) {
  const get = (key) => {
    if (params && typeof params.get === "function") {
      const v = params.get(key);
      return v == null ? "" : String(v);
    }
    const v = params?.[key];
    return v == null ? "" : String(v);
  };

  const locationQuery = get("location").trim();
  const cityQuery = get("city").trim();
  const countryQuery = get("country").trim();
  const typeQuery = get("type").trim();
  const minPrice = parseOptionalNumber(get("minPrice"));
  const maxPrice = parseOptionalNumber(get("maxPrice"));
  const minBeds = parsePositiveInt(get("minBeds"));
  const minBaths = parsePositiveInt(get("minBaths"));

  const mongoQuery = {};

  if (locationQuery) {
    const regex = new RegExp(escapeRegex(locationQuery), "i");
    mongoQuery.$or = [
      { "location.city": regex },
      { "location.state": regex },
      { "location.country": regex },
      { "location.street": regex },
      { "location.zipcode": regex },
      { name: regex },
    ];
  }

  if (cityQuery) {
    mongoQuery["location.city"] = {
      $regex: new RegExp(escapeRegex(cityQuery), "i"),
    };
  }

  if (countryQuery) {
    mongoQuery["location.country"] = {
      $regex: new RegExp(escapeRegex(countryQuery), "i"),
    };
  }

  if (typeQuery && typeQuery !== "All Properties") {
    mongoQuery.type = { $regex: new RegExp(escapeRegex(typeQuery), "i") };
  }

  if (minPrice != null || maxPrice != null) {
    const priceCond = {};
    if (minPrice != null) priceCond.$gte = minPrice;
    if (maxPrice != null) priceCond.$lte = maxPrice;

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

  if (minBeds != null) {
    mongoQuery.beds = { $gte: minBeds };
  }

  if (minBaths != null) {
    mongoQuery.baths = { $gte: minBaths };
  }

  const hasFilters = Boolean(
    locationQuery ||
      cityQuery ||
      countryQuery ||
      (typeQuery && typeQuery !== "All Properties") ||
      minPrice != null ||
      maxPrice != null ||
      minBeds != null ||
      minBaths != null,
  );

  if (options.excludeFeaturedWhenUnfiltered && !hasFilters) {
    mongoQuery.is_featured = false;
  }

  return {
    mongoQuery,
    hasFilters,
    filters: {
      location: locationQuery || null,
      city: cityQuery || null,
      country: countryQuery || null,
      type: typeQuery && typeQuery !== "All Properties" ? typeQuery : null,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
    },
  };
}

/**
 * Pagination for REST list endpoints.
 * @param {Record<string, string|null|undefined>|URLSearchParams|object} params
 * @param {{ defaultLimit?: number, maxLimit?: number }} [options]
 */
export function parseCatalogPagination(params = {}, options = {}) {
  const get = (key) => {
    if (params && typeof params.get === "function") {
      const v = params.get(key);
      return v == null ? "" : String(v);
    }
    const v = params?.[key];
    return v == null ? "" : String(v);
  };

  const defaultLimit = options.defaultLimit ?? 24;
  const maxLimit = options.maxLimit ?? 100;
  const page = Math.max(1, Number(get("page") || 1) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number(get("limit") || defaultLimit) || defaultLimit),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
