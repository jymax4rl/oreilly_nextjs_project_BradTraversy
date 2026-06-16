/** Resolve property image path — supports Cloudinary/Blob URLs or local filenames. */
export function propertyImageUrl(value) {
  if (!value) return "/properties/default.jpg";
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (typeof value === "string" && value.startsWith("/")) return value;
  return `/images/properties/${value}`;
}

export function propertyImageUrls(images = []) {
  if (!images?.length) return [propertyImageUrl(null)];
  return images.map(propertyImageUrl);
}
