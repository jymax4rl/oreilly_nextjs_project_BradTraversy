/**
 * Resolve property image/audio URLs from MongoDB (property.images[].url, property.audio.url).
 * Legacy string filenames still supported until backfill completes.
 */

/** Brad Traversy course assets are served from /public/properties */
const DEFAULT_IMAGE = "/properties/a1.jpg";

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

/**
 * @param {string | { url?: string; publicId?: string } | null | undefined} entry
 * @returns {string | null}
 */
export function resolvePropertyImageEntry(entry) {
  if (entry == null || entry === "") return null;
  if (typeof entry === "string") {
    if (isHttpUrl(entry)) return entry;
    const cleaned = entry
      .replace(/^\//, "")
      .replace(/^properties\//, "")
      .replace(/^images\/properties\//, "");
    return `/images/properties/${cleaned}`;
  }
  if (typeof entry === "object" && entry.url) {
    return entry.url;
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
    preferred ||
    resolvePropertyImageEntry(images[0]) ||
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
