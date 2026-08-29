/**
 * Resolve property image/audio URLs from MongoDB (property.images[].url, property.audio.url).
 * Legacy string filenames still supported until backfill completes.
 */

/** Brad Traversy course assets are served from /public/properties */
const DEFAULT_IMAGE = "/properties/a1.jpg";

function asSafeImageSrc(value) {
  if (typeof value !== "string") return null;
  const src = value.trim();
  if (!src || src.includes("[object Object]")) return null;
  return src;
}


function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function cloudinaryDeliveryUrl(publicId, resourceType = "image") {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dyrjziqft";
  const id = String(publicId || "").replace(/^\/+/, "");
  if (!id) return null;
  return `https://res.cloudinary.com/${cloud}/${resourceType}/upload/${id}`;
}

/**
 * @param {string | { url?: string; publicId?: string; resourceType?: string } | null | undefined} entry
 * @returns {string | null}
 */
export function resolvePropertyImageEntry(entry) {
  if (entry == null || entry === "") return null;
  // Never allow objects to stringify into "/properties/[object Object]"
  if (typeof entry === "object" && !Array.isArray(entry)) {
    if (entry.url && typeof entry.url === "string") return entry.url;
    if (entry.publicId) {
      return cloudinaryDeliveryUrl(
        entry.publicId,
        entry.resourceType === "video" ? "video" : "image",
      );
    }
    return null;
  }
  if (typeof entry === "string") {
    if (isHttpUrl(entry)) return entry;
    const cleaned = entry
      .replace(/^\//, "")
      .replace(/^properties\//, "")
      .replace(/^images\/properties\//, "");
    // Guard against accidental Object stringification
    if (!cleaned || cleaned === "[object Object]") return null;
    return `/images/properties/${cleaned}`;
  }
  return null;
}

/**
 * @param {string | { url?: string; publicId?: string } | null | undefined} audio
 * @returns {string | null}
 */
export function resolvePropertyAudioSrc(audio) {
  if (audio == null || audio === "") return null;
  if (typeof audio === "string") {
    if (isHttpUrl(audio)) return audio;
    const cleaned = audio.replace(/^\//, "").replace(/^audio\/properties\//, "");
    return `/audio/properties/${cleaned}`;
  }
  if (typeof audio === "object" && audio.url) {
    return audio.url;
  }
  return null;
}

/**
 * Normalized list of display URLs for galleries.
 * @param {Array<string | object> | undefined} images
 */
export function normalizePropertyImageUrls(images) {
  const list = (images || [])
    .map((entry) => resolvePropertyImageEntry(entry))
    .filter(Boolean);
  return list.length > 0 ? list : [DEFAULT_IMAGE];
}

/**
 * Primary card image (legacy: prefers index 1, then 0).
 * @param {Array<string | object> | undefined} images
 */
export function propertyCardImageSrc(images) {
  if (!images?.length) return DEFAULT_IMAGE;
  const preferred =
    images.length > 1 ? resolvePropertyImageEntry(images[1]) : null;
  return (
    asSafeImageSrc(preferred) ||
    asSafeImageSrc(resolvePropertyImageEntry(images[0])) ||
    DEFAULT_IMAGE
  );
}

/**
 * First image for OG / emails.
 * @param {Array<string | object> | undefined} images
 */
export function propertyPrimaryImageSrc(images) {
  return resolvePropertyImageEntry(images?.[0]) || DEFAULT_IMAGE;
}

/**
 * @param {string | { publicId?: string }} entry
 * @returns {boolean}
 */
export function isCloudinaryImageEntry(entry) {
  if (!entry || typeof entry !== "object") return false;
  return Boolean(entry.publicId);
}

/**
 * Absolute URL for emails (handles local paths and Cloudinary https).
 * @param {Array<string | object> | undefined} images
 * @param {(path: string) => string} appUrlFn
 */
export function propertyImageAbsoluteFromImages(images, appUrlFn) {
  const src = propertyPrimaryImageSrc(images);
  if (isHttpUrl(src)) return src;
  return appUrlFn(src.startsWith("/") ? src : `/properties/${src}`);
}

