import Property from "@/models/Property";
import { withApprovedListingFilter } from "@/utils/listingApproval";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";

const CARD_FIELDS =
  "name slug type location images rates listingPrice beds baths is_featured listing createdAt";

const DEFAULT_LIMIT = 8;

/**
 * Public listings from the same host, excluding the listing currently on screen.
 */
export async function findSameOwnerPublicListings(property, { limit = DEFAULT_LIMIT } = {}) {
  const ownerId = property?.owner?.toString?.() ?? String(property?.owner ?? "");
  const currentId = property?._id;
  if (!ownerId || !currentId) return [];

  const rows = await Property.find(
    withApprovedListingFilter({
      owner: ownerId,
      _id: { $ne: currentId },
    }),
  )
    .select(CARD_FIELDS)
    .sort({ is_featured: -1, createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 12))
    .lean();

  return rows.map((row) => serializePropertyForClient(row));
}
