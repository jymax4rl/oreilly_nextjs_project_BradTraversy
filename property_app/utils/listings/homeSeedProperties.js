import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { redactPreviewLockedCatalogFields } from "@/utils/listings/previewLockedHost";
import { buildCatalogMongoQuery } from "@/utils/listings/catalogQuery";
import { toHomeSeedCard } from "@/utils/listings/homeSeedCard";

export { toHomeSeedCard } from "@/utils/listings/homeSeedCard";

/** Lean projection for HomeMapDiscovery / PropertyCard cold-open seeds. */
const HOME_SEED_FIELDS =
  "_id slug name type beds baths square_feet listingPrice rates images location.lat location.lng location.city location.country location.state is_featured previewLocked seller_info";

const DEFAULT_LIMIT = 80;

async function fetchHomeSeedPropertiesFromApi(limit) {
  const base = (
    process.env.NEXT_PUBLIC_DOMAIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.isisel.com"
  ).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/properties?limit=${limit}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.properties) ? data.properties : [];
    return list.map(toHomeSeedCard).filter(Boolean);
  } catch (error) {
    console.error("home seed properties (api fallback):", error);
    return [];
  }
}

/**
 * SSR seed for home Discover: approved catalogue listings (lean card fields).
 * Uses the same catalog Mongo dialect as `/properties`.
 * Includes featured stays so cold-open count matches the live catalogue API.
 */
export async function fetchHomeSeedProperties({ limit = DEFAULT_LIMIT } = {}) {
  const capped = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 120);

  if (!process.env.MONGODB_URI) {
    return fetchHomeSeedPropertiesFromApi(capped);
  }

  try {
    const ok = await connectToDatabase();
    if (!ok) return fetchHomeSeedPropertiesFromApi(capped);

    const mongoQuery = buildCatalogMongoQuery({});
    // Unfiltered browse historically hides featured; Discover cold-open should
    // match the live catalogue API (featured included).
    delete mongoQuery.is_featured;

    const rows = await Property.find(mongoQuery)
      .select(HOME_SEED_FIELDS)
      .sort({ createdAt: -1 })
      .limit(capped)
      .lean();

    const serialized = redactPreviewLockedCatalogFields(
      rows.map(serializePropertyForClient),
    );

    return serialized.map(toHomeSeedCard).filter(Boolean);
  } catch (error) {
    console.error("home seed properties:", error);
    return fetchHomeSeedPropertiesFromApi(capped);
  }
}
