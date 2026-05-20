export const CLOUDINARY_ROOT = "kama-properties";

const SAFE_ID = /^[a-fA-F0-9]{24}$/;
const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

/**
 * @param {string} id
 * @param {string} label
 */
export function assertSafeMongoId(id, label = "id") {
  const value = String(id || "").trim();
  if (!SAFE_ID.test(value)) {
    throw new Error(`Invalid ${label}: must be a 24-character hex ObjectId`);
  }
  return value;
}

/**
 * @param {"images" | "audio" | "documents" | undefined} subfolder
 */
export function assertSafeMediaSubfolder(subfolder) {
  if (subfolder == null || subfolder === "") return undefined;
  if (!["images", "audio", "documents"].includes(subfolder)) {
    throw new Error("Invalid media subfolder");
  }
  return subfolder;
}

/**
 * Host root: kama-properties/hosts/{hostId}
 * @param {string} hostId MongoDB user id (property.owner)
 */
export function hostRootFolder(hostId) {
  const safeHostId = assertSafeMongoId(hostId, "hostId");
  return `${CLOUDINARY_ROOT}/hosts/${safeHostId}`;
}

/** @deprecated Use hostRootFolder */
export function userRootFolder(hostId) {
  return hostRootFolder(hostId);
}

/**
 * Listing folder: kama-properties/hosts/{hostId}/properties/{propertyId}
 * @param {string} hostId
 * @param {string} propertyId
 * @param {"images" | "audio" | "documents"} [subfolder]
 */
export function propertyFolder(hostId, propertyId, subfolder) {
  const safeHostId = assertSafeMongoId(hostId, "hostId");
  const safePropertyId = assertSafeMongoId(propertyId, "propertyId");
  const safeSub = assertSafeMediaSubfolder(subfolder);
  const base = `${CLOUDINARY_ROOT}/hosts/${safeHostId}/properties/${safePropertyId}`;
  return safeSub ? `${base}/${safeSub}` : base;
}

/** @param {string} hostId @param {string} propertyId */
export function propertyImagesFolder(hostId, propertyId) {
  return propertyFolder(hostId, propertyId, "images");
}

/** @param {string} hostId @param {string} propertyId */
export function propertyAudioFolder(hostId, propertyId) {
  return propertyFolder(hostId, propertyId, "audio");
}

export function sanitizeUploadFilename(name) {
  const base = String(name || "upload")
    .replace(/[/\\]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 180);
  if (!SAFE_SEGMENT.test(base.replace(/\./g, ""))) {
    return `upload_${Date.now()}`;
  }
  return base || `upload_${Date.now()}`;
}
