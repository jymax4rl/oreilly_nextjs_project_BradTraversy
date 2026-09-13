import {
  propertyCardImageUrl,
  propertyImageUrl,
} from "../propertyImageUrl.js";

/** Flat pin fields Expo Discover needs on catalog list items. */
export const DISCOVER_PIN_KEYS = [
  "id",
  "slug",
  "name",
  "type",
  "city",
  "country",
  "beds",
  "baths",
  "currency",
  "nightly",
  "imageUrl",
  "lat",
  "lng",
  "previewLocked",
];

function asNullableNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveNightly(property) {
  const fromListing = asNullableNumber(property?.listingPrice);
  if (fromListing != null) return fromListing;
  return asNullableNumber(property?.rates?.nightly);
}

function resolveImageUrl(property) {
  const images = property?.images;
  if (Array.isArray(images) && images.length > 0) {
    return propertyCardImageUrl(images) || propertyImageUrl(images[0]);
  }
  return propertyCardImageUrl(images);
}

/**
 * Top-level Discover pin aliases for a serialized catalog property.
 * Does not remove nested `location` / `rates` / `images`.
 */
export function toDiscoverPinFields(property) {
  const location = property?.location || {};
  return {
    id: property?.id != null ? String(property.id) : property?.id ?? null,
    slug: property?.slug ?? null,
    name: property?.name ?? null,
    type: property?.type ?? null,
    city: location.city ?? null,
    country: location.country ?? null,
    beds: property?.beds ?? null,
    baths: property?.baths ?? null,
    currency: "USD",
    nightly: resolveNightly(property),
    imageUrl: resolveImageUrl(property),
    lat: asNullableNumber(location.lat),
    lng: asNullableNumber(location.lng),
    previewLocked: Boolean(property?.previewLocked),
  };
}

/** Spread pin aliases onto a full serialized property (nested fields kept). */
export function withCatalogPinAliases(property) {
  if (!property || typeof property !== "object") return property;
  return {
    ...property,
    ...toDiscoverPinFields(property),
  };
}

/** Bandwidth-friendly list shape: pin fields only. */
export function toDiscoverPinOnly(property) {
  return toDiscoverPinFields(property);
}
