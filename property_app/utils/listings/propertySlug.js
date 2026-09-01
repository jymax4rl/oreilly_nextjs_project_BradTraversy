import Property from "@/models/Property";
import { appUrl } from "@/utils/appUrl";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

/** App routes under /properties that must never be used as listing slugs. */
export const RESERVED_LISTING_SLUGS = new Set(["add", "my-listings"]);

const SLUG_MAX = 96;

export function isMongoObjectIdString(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value.trim());
}

/**
 * ASCII slug token for a name or place. Accents fold; punctuation becomes dashes.
 */
export function slugifyListingPart(value) {
  const folded = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return folded.slice(0, 60);
}

/**
 * Preferred public key: name-city-country. Empty parts are dropped.
 * Example: "almadies-ocean-villa-dakar-senegal".
 */
export function listingSlugBase(property) {
  const name = slugifyListingPart(property?.name) || "stay";
  const city = slugifyListingPart(property?.location?.city);
  const country = slugifyListingPart(property?.location?.country);
  const joined = [name, city, country].filter(Boolean).join("-");
  return joined.slice(0, SLUG_MAX) || "stay";
}

function sanitizeCandidate(base) {
  let candidate = slugifyListingPart(base).replace(/-+/g, "-") || "stay";
  if (RESERVED_LISTING_SLUGS.has(candidate) || isMongoObjectIdString(candidate)) {
    candidate = `stay-${candidate}`.replace(/-+/g, "-");
  }
  return candidate.slice(0, SLUG_MAX);
}

/**
 * Pick a unique slug. First try the readable base; then -2, -3, …;
 * finally append the listing id tail if the collection is crowded.
 */
export async function allocateUniqueSlug(base, excludeId) {
  const root = sanitizeCandidate(base);
  for (let i = 0; i < 40; i += 1) {
    const slug = i === 0 ? root : `${root}-${i + 1}`.slice(0, SLUG_MAX);
    const clash = await Property.findOne({ slug }).select("_id").lean();
    if (!clash || String(clash._id) === String(excludeId)) {
      return slug;
    }
  }
  const suffix =
    String(excludeId || "")
      .replace(/[^a-f0-9]/gi, "")
      .slice(-6) || "stay";
  return `${root}-${suffix}`.slice(0, SLUG_MAX);
}

/**
 * Stable slug: write once. Renames do not change the URL (avoids breaking
 * indexed links). Missing slugs are filled on first public read or create.
 */
export async function ensurePropertySlug(property) {
  if (!property?._id) return property;
  if (
    typeof property.slug === "string" &&
    property.slug &&
    !RESERVED_LISTING_SLUGS.has(property.slug)
  ) {
    return property;
  }
  const slug = await allocateUniqueSlug(listingSlugBase(property), property._id);
  await Property.updateOne({ _id: property._id }, { $set: { slug } });
  return { ...property, slug };
}

export async function ensurePropertySlugs(properties) {
  const list = Array.isArray(properties) ? properties : [];
  const out = [];
  for (const row of list) {
    out.push(await ensurePropertySlug(row));
  }
  return out;
}

/**
 * Load a listing from /properties/[id] where [id] is either the Mongo id
 * (legacy, still used by host tools) or the public slug.
 */
export async function findPropertyByParam(param, projection) {
  if (param == null || param === "") return null;
  const raw = String(param).trim();
  if (!raw) return null;

  const query = (filter) =>
    projection
      ? Property.findOne(filter).select(projection).lean()
      : Property.findOne(filter).lean();

  if (isMongoObjectIdString(raw)) {
    try {
      const byId = projection
        ? await Property.findById(raw).select(projection).lean()
        : await Property.findById(raw).lean();
      if (byId) return byId;
    } catch {
      /* invalid id shape should not 500 the page */
    }
  }

  return query({ slug: raw.toLowerCase() });
}

/**
 * Resolve a public path from a listing object or an id string.
 * Ensures a slug exists so emails and sitemaps do not keep advertising ObjectIds.
 */
export async function listingPublicPathFor(propertyOrId) {
  if (propertyOrId && typeof propertyOrId === "object") {
    const ensured = await ensurePropertySlug(propertyOrId);
    return propertyPublicPath(ensured);
  }
  const id = propertyOrId != null ? String(propertyOrId) : "";
  if (!id) return "/properties";
  const doc = await Property.findById(id)
    .select("slug name location")
    .lean();
  if (!doc) return `/properties/${id}`;
  const ensured = await ensurePropertySlug(doc);
  return propertyPublicPath(ensured);
}

export async function listingPublicUrlFor(propertyOrId) {
  return appUrl(await listingPublicPathFor(propertyOrId));
}
