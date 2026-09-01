import { appUrl } from "@/utils/appUrl";

/**
 * Public listing path. Prefers the SEO slug; falls back to the Mongo id so
 * cards still link before the first backfill write lands.
 * Safe for client components (no mongoose).
 */
export function propertyPublicPath(property) {
  if (!property) return "/properties";
  const slug =
    typeof property.slug === "string" ? property.slug.trim() : "";
  if (slug) return `/properties/${slug}`;
  const id = property._id?.toString?.() ?? property._id;
  if (id) return `/properties/${id}`;
  return "/properties";
}

export function propertyPublicUrl(property) {
  return appUrl(propertyPublicPath(property));
}
