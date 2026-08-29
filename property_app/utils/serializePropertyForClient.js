import { normalizeRates } from "@/utils/propertyRates";

/**
 * Mongoose .lean() docs may include ObjectIds and Dates.
 * Next.js Server → Client Component props must be plain serializable values.
 */
export function serializePropertyForClient(property) {
  const idToString = (v) =>
    v != null &&
    typeof v === "object" &&
    typeof v.toString === "function" &&
    !(v instanceof Date)
      ? v.toString()
      : v;

  return {
    ...property,
    _id: property._id?.toString?.() ?? String(property._id),
    owner: idToString(property.owner),
    name:
      property.name == null || typeof property.name === "object"
        ? ""
        : String(property.name),
    type:
      property.type == null || typeof property.type === "object"
        ? ""
        : String(property.type),
    description:
      property.description == null || typeof property.description === "object"
        ? ""
        : String(property.description),
    beds:
      typeof property.beds === "number"
        ? property.beds
        : Number(property.beds) || 0,
    baths:
      typeof property.baths === "number"
        ? property.baths
        : Number(property.baths) || 0,
    square_feet:
      typeof property.square_feet === "number"
        ? property.square_feet
        : Number(property.square_feet) || 0,
    location: {
      street: stringifyLoc(property.location?.street),
      city: stringifyLoc(property.location?.city),
      state: stringifyLoc(property.location?.state),
      zipcode: stringifyLoc(property.location?.zipcode),
      country: stringifyLoc(property.location?.country),
    },
    reviewedBy:
      property.reviewedBy != null ? idToString(property.reviewedBy) : undefined,
    createdAt:
      property.createdAt instanceof Date
        ? property.createdAt.toISOString()
        : property.createdAt,
    updatedAt:
      property.updatedAt instanceof Date
        ? property.updatedAt.toISOString()
        : property.updatedAt,
    reviewedAt:
      property.reviewedAt instanceof Date
        ? property.reviewedAt.toISOString()
        : property.reviewedAt,
    listingModerationRequestedAt:
      property.listingModerationRequestedAt instanceof Date
        ? property.listingModerationRequestedAt.toISOString()
        : property.listingModerationRequestedAt,
    rates: normalizeRates(property.rates),
    images: serializePropertyImages(property.images),
    audio: serializePropertyAudio(property.audio),
    amenities: Array.isArray(property.amenities)
      ? property.amenities
          .map((a) => (typeof a === "string" || typeof a === "number" ? String(a) : null))
          .filter(Boolean)
      : [],
  };
}

function stringifyLoc(value) {
  if (value == null || typeof value === "object") return "";
  return String(value);
}

function serializePropertyImages(images) {
  if (!Array.isArray(images)) return images;
  return images.map((entry) => {
    if (!entry || typeof entry !== "object") return entry;
    return {
      ...entry,
      uploadedAt:
        entry.uploadedAt instanceof Date
          ? entry.uploadedAt.toISOString()
          : entry.uploadedAt,
    };
  });
}

function serializePropertyAudio(audio) {
  if (!audio || typeof audio !== "object") return audio;
  return { ...audio };
}
