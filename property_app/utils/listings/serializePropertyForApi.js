import { serializePropertyForClient } from "@/utils/serializePropertyForClient";

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

/** Strip moderation / Cloudinary internals; add string `id` alias. */
export function toPublicPropertyApiShape(plain) {
  const out = {};
  for (const [key, value] of Object.entries(plain || {})) {
    if (PRIVATE_LISTING_KEYS.has(key)) continue;
    out[key] = value;
  }
  if (out._id != null) out.id = String(out._id);
  return out;
}

/**
 * Public REST shape: client-safe serialization + string `id` alias for `_id`.
 * Strips moderation / Cloudinary internals not needed by Expo or public clients.
 */
export function serializePropertyForApi(property) {
  return toPublicPropertyApiShape(serializePropertyForClient(property));
}
