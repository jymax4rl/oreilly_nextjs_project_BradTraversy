/** Default placeholder when a listing has no resolvable image. */
const DEFAULT_IMAGE = "/properties/a1.jpg";

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function cloudName() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    "dyrjziqft"
  );
}

function looksLikeCloudinaryPublicId(value) {
  if (typeof value !== "string" || !value) return false;
  if (isHttpUrl(value) || value.startsWith("/")) return false;
  return (
    value.startsWith("kama-properties/") ||
    (value.includes("/") && !/^[a-zA-Z0-9._-]+$/.test(value))
  );
}

function cloudinaryImageUrl(publicId) {
  const id = String(publicId).replace(/^\/+/, "");
  return `https://res.cloudinary.com/${cloudName()}/image/upload/${id}`;
}

/**
 * Resolve a property image entry (string URL, Cloudinary public_id, legacy filename, or { url, publicId }).
 */
export function propertyImageUrl(value) {
  if (value == null || value === "") return DEFAULT_IMAGE;

  if (typeof value === "object") {
    if (value.url) return propertyImageUrl(value.url);
    if (value.publicId) return cloudinaryImageUrl(value.publicId);
    return DEFAULT_IMAGE;
  }

  if (typeof value !== "string") return DEFAULT_IMAGE;

  if (isHttpUrl(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;

  if (looksLikeCloudinaryPublicId(value)) {
    return cloudinaryImageUrl(value);
  }

  const cleaned = value
    .replace(/^\//, "")
    .replace(/^properties\//, "")
    .replace(/^images\/properties\//, "");

  return `/images/properties/${cleaned}`;
}

export function propertyImageUrls(images = []) {
  const list = (images || [])
    .map((entry) => propertyImageUrl(entry))
    .filter((url) => url !== DEFAULT_IMAGE || images.length === 0);
  return list.length > 0 ? list : [DEFAULT_IMAGE];
}

/** Primary card image (legacy: prefers index 1, then 0). */
export function propertyCardImageUrl(images) {
  if (!images?.length) return DEFAULT_IMAGE;
  const preferred = images.length > 1 ? propertyImageUrl(images[1]) : null;
  return preferred || propertyImageUrl(images[0]) || DEFAULT_IMAGE;
}

/** Absolute URL for OG tags and emails. */
export function propertyImageAbsoluteUrl(value, siteUrl) {
  const src = propertyImageUrl(value);
  if (isHttpUrl(src)) return src;
  const base = String(siteUrl || "").replace(/\/$/, "");
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

/**
 * Resolve property audio (string URL, legacy filename, or { url, publicId }).
 */
export function propertyAudioUrl(value) {
  if (value == null || value === "") return null;

  if (typeof value === "object") {
    if (value.url) return propertyAudioUrl(value.url);
    if (value.publicId) {
      const id = String(value.publicId).replace(/^\/+/, "");
      return `https://res.cloudinary.com/${cloudName()}/video/upload/${id}`;
    }
    return null;
  }

  if (typeof value !== "string") return null;
  if (isHttpUrl(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;

  if (looksLikeCloudinaryPublicId(value)) {
    const id = value.replace(/^\/+/, "");
    return `https://res.cloudinary.com/${cloudName()}/video/upload/${id}`;
  }

  const cleaned = value
    .replace(/^\//, "")
    .replace(/^audio\/properties\//, "");
  return `/audio/properties/${cleaned}`;
}
