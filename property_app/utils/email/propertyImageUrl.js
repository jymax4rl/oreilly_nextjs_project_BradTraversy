import { appUrl, getAppBaseUrl } from "@/utils/appUrl";
import { propertyImageAbsoluteFromImages } from "@/utils/cloudinary/propertyMediaUrls";

export function getAbsoluteAppUrl(path = "") {
  return appUrl(path);
}

export { getAppBaseUrl };

/**
 * Absolute URL for a property listing image (matches PropertyCard paths).
 * @param {string[] | undefined} images
 */
export function propertyImageAbsoluteUrl(images) {
  return propertyImageAbsoluteFromImages(images, appUrl);
}

/**
 * @param {{ city?: string; country?: string } | null | undefined} location
 */
export function formatPropertyLocation(location) {
  if (!location) return "";
  return [location.city, location.country].filter(Boolean).join(", ");
}
