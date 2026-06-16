export const CLOUDINARY_ROOT = "kama-properties";

const SAFE_ID = /^[a-fA-F0-9]{24}$/;
const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

export function assertSafeMongoId(id, label = "id") {
  const value = String(id || "").trim();
  if (!SAFE_ID.test(value)) {
    throw new Error(`Invalid ${label}: must be a 24-character hex ObjectId`);
  }
  return value;
}

export function assertSafeMediaSubfolder(subfolder) {
  if (subfolder == null || subfolder === "") return undefined;
  if (!["images", "audio", "documents"].includes(subfolder)) {
    throw new Error("Invalid media subfolder");
  }
  return subfolder;
}

export function hostRootFolder(hostId) {
  const safeHostId = assertSafeMongoId(hostId, "hostId");
  return `${CLOUDINARY_ROOT}/hosts/${safeHostId}`;
}

export function propertyFolder(hostId, propertyId, subfolder) {
  const safeHostId = assertSafeMongoId(hostId, "hostId");
  const safePropertyId = assertSafeMongoId(propertyId, "propertyId");
  const safeSub = assertSafeMediaSubfolder(subfolder);
  const base = `${CLOUDINARY_ROOT}/hosts/${safeHostId}/properties/${safePropertyId}`;
  return safeSub ? `${base}/${safeSub}` : base;
}

export function propertyImagesFolder(hostId, propertyId) {
  return propertyFolder(hostId, propertyId, "images");
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
