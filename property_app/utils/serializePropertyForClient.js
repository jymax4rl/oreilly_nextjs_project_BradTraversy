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
    images: serializePropertyImages(property.images),
    audio: serializePropertyAudio(property.audio),
  };
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
