/**
 * Smoke checks for public catalog query + API serialization helpers (no Mongo).
 * Run: node scripts/smoke-public-properties-api.mjs
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function load(rel) {
  return import(pathToFileURL(path.join(appRoot, rel)).href);
}

const { buildCatalogPropertyQuery, parseCatalogPagination } = await load(
  "utils/listings/buildCatalogPropertyQuery.js",
);
const { serializePropertyForClient } = await load(
  "utils/serializePropertyForClient.js",
);
const {
  toDiscoverPinFields,
  toDiscoverPinOnly,
  withCatalogPinAliases,
} = await load("utils/listings/withCatalogPinAliases.js");

// Mirror PRIVATE_LISTING_KEYS / toPublicPropertyApiShape (keeps smoke free of @/ alias).
const PRIVATE_LISTING_KEYS = new Set([
  "rejectionReason",
  "listingModerationRequestedAt",
  "listingReviewedAt",
  "listingReviewedBy",
  "reviewedBy",
  "internalNotes",
  "cloudinaryFolder",
  "cloudinaryImagesFolder",
  "cloudinaryMigrationStatus",
  "__v",
]);

function toPublicPropertyApiShape(plain) {
  const out = {};
  for (const [key, value] of Object.entries(plain || {})) {
    if (PRIVATE_LISTING_KEYS.has(key)) continue;
    out[key] = value;
  }
  if (out._id != null) out.id = String(out._id);
  return out;
}

function serializePropertyForApi(property) {
  return toPublicPropertyApiShape(serializePropertyForClient(property));
}

{
  const { mongoQuery, hasFilters, filters } = buildCatalogPropertyQuery({
    location: "Dakar",
    type: "Apartment",
    minPrice: "50",
    maxPrice: "200",
    minBeds: "2",
    minBaths: "1",
  });
  assert.equal(hasFilters, true);
  assert.equal(filters.location, "Dakar");
  assert.equal(filters.type, "Apartment");
  assert.equal(filters.minPrice, 50);
  assert.equal(filters.maxPrice, 200);
  assert.equal(filters.minBeds, 2);
  assert.equal(filters.minBaths, 1);
  assert.equal(mongoQuery.beds.$gte, 2);
  assert.equal(mongoQuery.baths.$gte, 1);
  assert.ok(Array.isArray(mongoQuery.$or));
  assert.ok(mongoQuery.type.$regex instanceof RegExp);
  assert.ok(Array.isArray(mongoQuery.$and));
}

{
  const { mongoQuery, hasFilters } = buildCatalogPropertyQuery(
    {},
    { excludeFeaturedWhenUnfiltered: true },
  );
  assert.equal(hasFilters, false);
  assert.equal(mongoQuery.is_featured, false);
}

{
  const { mongoQuery } = buildCatalogPropertyQuery({});
  assert.equal(mongoQuery.is_featured, undefined);
}

{
  const { mongoQuery, filters } = buildCatalogPropertyQuery({
    city: "Accra",
    country: "Ghana",
  });
  assert.equal(filters.city, "Accra");
  assert.equal(filters.country, "Ghana");
  assert.ok(mongoQuery["location.city"].$regex instanceof RegExp);
  assert.ok(mongoQuery["location.country"].$regex instanceof RegExp);
}

{
  const { mongoQuery } = buildCatalogPropertyQuery({
    type: "All Properties",
  });
  assert.equal(mongoQuery.type, undefined);
}

{
  const page = parseCatalogPagination({ page: "2", limit: "10" });
  assert.deepEqual(page, { page: 2, limit: 10, skip: 10 });
  const capped = parseCatalogPagination({ limit: "999" });
  assert.equal(capped.limit, 100);
  const defaults = parseCatalogPagination({});
  assert.equal(defaults.page, 1);
  assert.equal(defaults.limit, 24);
  assert.equal(defaults.skip, 0);
}

{
  const params = new URLSearchParams(
    "location=Lagos&minBeds=3&page=1&limit=12",
  );
  const { filters, hasFilters } = buildCatalogPropertyQuery(params);
  assert.equal(hasFilters, true);
  assert.equal(filters.location, "Lagos");
  assert.equal(filters.minBeds, 3);
  const { limit } = parseCatalogPagination(params);
  assert.equal(limit, 12);
}

{
  class ObjectId {
    constructor(id) {
      this.id = id;
    }
    toString() {
      return this.id;
    }
  }
  const doc = {
    _id: new ObjectId("507f1f77bcf86cd799439011"),
    name: "Ocean Villa",
    type: "Villa",
    status: "approved",
    beds: 3,
    baths: 2,
    square_feet: 1200,
    rates: { nightly: 120, weekly: null, monthly: null, weekendPremium: 0 },
    listingPrice: 120,
    images: [{ url: "https://cdn.example/a.jpg", publicId: "a" }],
    slug: "ocean-villa-dakar-senegal",
    description: "Sea view",
    amenities: ["Wifi", "Pool"],
    seller_info: { name: "Awa", email: "awa@example.com", phone: "" },
    checkInTime: "15:00",
    checkOutTime: "11:00",
    location: { city: "Dakar", country: "Senegal" },
    rejectionReason: "secret",
    listingModerationRequestedAt: new Date("2024-01-01"),
    cloudinaryFolder: "hosts/x",
    owner: new ObjectId("507f1f77bcf86cd799439012"),
  };

  const api = serializePropertyForApi(doc);
  assert.equal(api.id, "507f1f77bcf86cd799439011");
  assert.equal(api._id, "507f1f77bcf86cd799439011");
  assert.equal(api.owner, "507f1f77bcf86cd799439012");
  assert.equal(api.name, "Ocean Villa");
  assert.equal(api.listingPrice, 120);
  assert.equal(api.images[0].url, "https://cdn.example/a.jpg");
  assert.equal(api.rejectionReason, undefined);
  assert.equal(api.cloudinaryFolder, undefined);
  assert.equal(api.listingModerationRequestedAt, undefined);
  assert.deepEqual(api.amenities, ["Wifi", "Pool"]);
  assert.equal(api.checkInTime, "15:00");
  assert.equal(api.seller_info.name, "Awa");

  const withPins = withCatalogPinAliases(api);
  assert.equal(withPins.city, "Dakar");
  assert.equal(withPins.country, "Senegal");
  assert.equal(withPins.lat, null);
  assert.equal(withPins.lng, null);
  assert.equal(withPins.nightly, 120);
  assert.equal(withPins.currency, "USD");
  assert.equal(withPins.imageUrl, "https://cdn.example/a.jpg");
  assert.equal(withPins.beds, 3);
  assert.equal(withPins.baths, 2);
  assert.equal(withPins.previewLocked, false);
  assert.equal(withPins.location.city, "Dakar");
  assert.equal(withPins.rates.nightly, 120);
  assert.equal(withPins.images[0].url, "https://cdn.example/a.jpg");
  assert.equal(withPins.listingPrice, 120);
}

{
  const pin = toDiscoverPinFields({
    id: "abc",
    slug: "villa-accra",
    name: "Hill Villa",
    type: "Villa",
    beds: 4,
    baths: 3,
    listingPrice: null,
    rates: { nightly: 85 },
    images: [
      "https://cdn.example/cover.jpg",
      "https://cdn.example/card.jpg",
    ],
    location: { city: "Accra", country: "Ghana", lat: 5.6, lng: -0.2 },
    previewLocked: true,
  });
  assert.deepEqual(pin, {
    id: "abc",
    slug: "villa-accra",
    name: "Hill Villa",
    type: "Villa",
    city: "Accra",
    country: "Ghana",
    beds: 4,
    baths: 3,
    currency: "USD",
    nightly: 85,
    imageUrl: "https://cdn.example/card.jpg",
    lat: 5.6,
    lng: -0.2,
    previewLocked: true,
  });

  const only = toDiscoverPinOnly({
    id: "abc",
    slug: "villa-accra",
    name: "Hill Villa",
    type: "Villa",
    beds: 4,
    baths: 3,
    listingPrice: 99,
    rates: { nightly: 85 },
    images: ["photo.jpg"],
    location: { city: null, country: "Ghana", lat: "5.6", lng: "-0.2" },
    host: { name: "secret" },
    ratesNestedKeep: true,
  });
  assert.equal(only.nightly, 99);
  assert.equal(only.city, null);
  assert.equal(only.lat, 5.6);
  assert.equal(only.lng, -0.2);
  assert.equal(only.host, undefined);
  assert.equal(only.imageUrl, "/images/properties/photo.jpg");
}

{
  const {
    getGuestCatalogAllowedOrigins,
    isAllowedGuestCatalogOrigin,
    guestCatalogCorsHeaders,
    guestCatalogCorsPreflight,
    withGuestCatalogCors,
  } = await load("utils/listings/guestCatalogCors.js");

  const defaults = getGuestCatalogAllowedOrigins();
  assert.ok(defaults.includes("http://localhost:8081"));
  assert.ok(defaults.includes("http://localhost:19006"));
  assert.ok(defaults.includes("http://127.0.0.1:8081"));
  assert.ok(defaults.includes("http://127.0.0.1:19006"));
  assert.equal(isAllowedGuestCatalogOrigin("http://localhost:8081"), true);
  assert.equal(isAllowedGuestCatalogOrigin("https://evil.example"), false);
  assert.equal(isAllowedGuestCatalogOrigin(null), false);

  const prev = process.env.CATALOG_CORS_ORIGINS;
  process.env.CATALOG_CORS_ORIGINS = "https://preview.expo.dev, http://localhost:9999";
  try {
    const extended = getGuestCatalogAllowedOrigins();
    assert.ok(extended.includes("https://preview.expo.dev"));
    assert.ok(extended.includes("http://localhost:9999"));
    assert.ok(extended.includes("http://localhost:8081"));
    assert.equal(isAllowedGuestCatalogOrigin("https://preview.expo.dev"), true);
  } finally {
    if (prev === undefined) delete process.env.CATALOG_CORS_ORIGINS;
    else process.env.CATALOG_CORS_ORIGINS = prev;
  }

  function fakeRequest(origin) {
    return {
      headers: {
        get(name) {
          return name.toLowerCase() === "origin" ? origin : null;
        },
      },
    };
  }

  const allowedHeaders = guestCatalogCorsHeaders(
    fakeRequest("http://localhost:8081"),
  );
  assert.equal(
    allowedHeaders.get("Access-Control-Allow-Origin"),
    "http://localhost:8081",
  );
  assert.equal(allowedHeaders.get("Access-Control-Allow-Credentials"), "false");
  assert.equal(
    allowedHeaders.get("Access-Control-Allow-Methods"),
    "GET, HEAD, OPTIONS",
  );
  assert.ok(!String(allowedHeaders.get("Access-Control-Allow-Methods")).includes("POST"));
  assert.equal(allowedHeaders.get("Vary"), "Origin");

  const deniedHeaders = guestCatalogCorsHeaders(
    fakeRequest("https://evil.example"),
  );
  assert.equal(deniedHeaders.get("Access-Control-Allow-Origin"), null);
  assert.notEqual(deniedHeaders.get("Access-Control-Allow-Origin"), "*");

  const noOriginHeaders = guestCatalogCorsHeaders(fakeRequest(null));
  assert.equal(noOriginHeaders.get("Access-Control-Allow-Origin"), null);

  const preflight = guestCatalogCorsPreflight(
    fakeRequest("http://127.0.0.1:19006"),
  );
  assert.equal(preflight.status, 204);
  assert.equal(
    preflight.headers.get("Access-Control-Allow-Origin"),
    "http://127.0.0.1:19006",
  );

  const deniedPreflight = guestCatalogCorsPreflight(
    fakeRequest("https://evil.example"),
  );
  assert.equal(deniedPreflight.status, 204);
  assert.equal(deniedPreflight.headers.get("Access-Control-Allow-Origin"), null);

  const wrapped = withGuestCatalogCors(
    fakeRequest("http://localhost:8081"),
    Response.json({ ok: true }, { status: 200 }),
  );
  assert.equal(wrapped.status, 200);
  assert.equal(
    wrapped.headers.get("Access-Control-Allow-Origin"),
    "http://localhost:8081",
  );
  assert.equal(wrapped.headers.get("Content-Type"), "application/json");
}

console.log("smoke-public-properties-api: ok");
