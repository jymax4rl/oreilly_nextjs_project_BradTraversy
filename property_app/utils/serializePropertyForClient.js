function isObjectId(value) {
  return (
    value != null &&
    typeof value === "object" &&
    value.constructor?.name === "ObjectId" &&
    typeof value.toString === "function"
  );
}

function toPlainJson(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (isObjectId(value)) return value.toString();
  if (Array.isArray(value)) return value.map(toPlainJson);
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === "__v" || key === "_doc") continue;
      out[key] = toPlainJson(val);
    }
    return out;
  }
  return value;
}

function serializePropertyImageEntry(entry) {
  if (entry == null) return entry;
  if (typeof entry === "string") return entry;
  if (typeof entry !== "object") return String(entry);

  const plain = toPlainJson(entry);
  const normalized = {
    url: plain.url,
    publicId: plain.publicId,
    resourceType: plain.resourceType,
    uploadedAt: plain.uploadedAt,
  };

  if (normalized.url || normalized.publicId) {
    return normalized;
  }

  return plain;
}

function serializePropertyImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(serializePropertyImageEntry).filter(Boolean);
}

function serializePropertyAudio(audio) {
  if (audio == null || audio === "") return audio;
  if (typeof audio === "string") return audio;
  if (typeof audio !== "object") return audio;

  const plain = toPlainJson(audio);
  return {
    url: plain.url,
    publicId: plain.publicId,
    resourceType: plain.resourceType,
  };
}

function normalizeRates(rates) {
  const plain = toPlainJson(rates || {});
  return {
    nightly: plain.nightly ?? null,
    weekly: plain.weekly ?? null,
    monthly: plain.monthly ?? null,
    weekendPremium: plain.weekendPremium ?? 0,
  };
}

/**
 * Mongoose .lean() docs may include ObjectIds and Dates.
 * Next.js Server → Client Component props must be plain serializable values.
 */
export function serializePropertyForClient(property) {
  const plain = toPlainJson(property);

  return {
    ...plain,
    _id: property._id?.toString?.() ?? String(property._id),
    owner: plain.owner != null ? String(plain.owner) : plain.owner,
    reviewedBy:
      plain.reviewedBy != null ? String(plain.reviewedBy) : undefined,
    rates: normalizeRates(plain.rates),
    images: serializePropertyImages(property.images),
    audio: serializePropertyAudio(property.audio),
  };
}
