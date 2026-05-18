import { appUrl, getAppBaseUrl } from "@/utils/appUrl";

export function getAbsoluteAppUrl(path = "") {
  return appUrl(path);
}

export { getAppBaseUrl };

/**
 * Absolute URL for a property listing image (matches PropertyCard paths).
 * @param {string[] | undefined} images
 */
export function propertyImageAbsoluteUrl(images) {
  const file = images?.[1] || images?.[0] || "default.jpg";
  const cleaned = String(file)
    .replace(/^\//, "")
    .replace(/^properties\//, "")
    .replace(/^images\/properties\//, "");
  return appUrl(`/properties/${cleaned}`);
}

/**
 * @param {{ city?: string; country?: string } | null | undefined} location
 */
export function formatPropertyLocation(location) {
  if (!location) return "";
  return [location.city, location.country].filter(Boolean).join(", ");
}
