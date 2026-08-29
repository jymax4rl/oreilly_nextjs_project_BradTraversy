import { resolvePropertyImageEntry } from "@/utils/cloudinary/propertyMediaUrls";

/**
 * Public browse quality gate for demo / marketplace surfaces.
 * Does NOT delete Mongo documents — hosts still see their listings in
 * my-listings / host dashboards. Apply only when loading public catalogs.
 *
 * Rules (Aug 2026 audit of KamaProperties.Properties, 54 docs):
 * 1. Require >= 2 resolvable images (Cloudinary objects or legacy strings).
 * 2. Denylist known text/flyer/test / non-rental graphic listings by id + name.
 * 3. Deduplicate by listing id when assembling the public catalog.
 *
 * Excluded (examples):
 * - 23 listings with 0–1 images (Ankh stubs, Karen text-doc uploads, Kfc, Zumbi, …)
 * - All "Karen Suburb Cottage" — seed + 7 clones; clones use French text/document
 *   screenshots (Mme Khadija Diallo / remboursement) as the card image
 * - 6a0e1f1a9013b8eedcbfd674 "Jimmeh Camara" — AI/museum graphics
 * - 6a0e1f54763fb77e0063bda3 "Ankh hotep" — test cafe photos
 */

/** @type {ReadonlySet<string>} */
export const PUBLIC_LISTING_QUALITY_DENYLIST_IDS = new Set([
  // Jimmeh Camara — cinematic/museum graphics, not a real rental property
  "6a0e1f1a9013b8eedcbfd674",
  // Ankh hotep — leftover test listing with non-rental cafe photos
  "6a0e1f54763fb77e0063bda3",
  // Karen Suburb Cottage — text-document screenshot clones + original (hide all for demo)
  "6943ecf6723ca1c04e9089a6",
  "6962cd5cde3f54feccd5b974",
  "6962cd75de3f54feccd5b979",
  "6962d02f75fd83927ddbff93",
  "696a43cf02a1d81d6eb3467f",
  "69fb7a182a47f04474fcc951",
  "69fb7a6e2a47f04474fcc957",
  "69fb7ca54093d5e419d44c59",
]);

/** Exact names (case-insensitive) for obvious junk / flyer / text-doc uploads */
const PUBLIC_LISTING_QUALITY_DENYLIST_NAMES = new Set([
  "ankh hotep",
  "kfc",
  "zumbi",
  "jimmeh camara",
  "jimmehcamara",
  "karen suburb cottage",
  "karensuburbcottage",
]);

/**
 * Count images that can actually be displayed (url / publicId / legacy path).
 * @param {{ images?: unknown[] } | null | undefined} property
 * @returns {number}
 */
export function countResolvablePropertyImages(property) {
  const images = property?.images;
  if (!Array.isArray(images) || images.length === 0) return 0;
  let count = 0;
  for (const entry of images) {
    if (resolvePropertyImageEntry(entry)) count += 1;
  }
  return count;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function propertyIdString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value?.toString === "function") return value.toString();
  return String(value);
}

/**
 * @param {unknown} name
 * @returns {boolean}
 */
function isDenylistedListingName(name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!normalized) return false;
  if (PUBLIC_LISTING_QUALITY_DENYLIST_NAMES.has(normalized)) return true;
  return PUBLIC_LISTING_QUALITY_DENYLIST_NAMES.has(
    normalized.replace(/\s+/g, ""),
  );
}

/**
 * True when a listing is good enough to show on public browse / home.
 * @param {{ _id?: unknown; id?: unknown; name?: unknown; images?: unknown[] } | null | undefined} property
 * @returns {boolean}
 */
export function isDemoQualityListing(property) {
  if (!property) return false;

  const id = propertyIdString(property._id ?? property.id);
  if (id && PUBLIC_LISTING_QUALITY_DENYLIST_IDS.has(id)) return false;

  if (isDenylistedListingName(property.name)) return false;

  if (countResolvablePropertyImages(property) < 2) return false;

  return true;
}

/**
 * Filter to demo-quality listings and drop duplicate ids (first wins).
 * @template T
 * @param {T[]} properties
 * @returns {T[]}
 */
export function filterDemoQualityListings(properties) {
  if (!Array.isArray(properties)) return [];
  const seen = new Set();
  const out = [];
  for (const property of properties) {
    if (!isDemoQualityListing(property)) continue;
    const id = propertyIdString(property?._id ?? property?.id);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(property);
  }
  return out;
}
