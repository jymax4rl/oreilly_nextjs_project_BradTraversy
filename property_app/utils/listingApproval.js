/**
 * Listing moderation: new listings start as `pending`; legacy docs without
 * `listingStatus` are treated as approved for backward compatibility.
 */

export function approvedListingQuery() {
  return {
    $or: [
      { listingStatus: "approved" },
      { listingStatus: { $exists: false } },
    ],
  };
}

export function isPubliclyVisibleListing(property) {
  if (!property) return false;
  const s = property.listingStatus;
  if (s === "pending" || s === "rejected") return false;
  return true;
}

export function canUserViewListing(property, session) {
  if (!property) return false;
  if (isPubliclyVisibleListing(property)) return true;
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  const ownerId =
    property.owner?.toString?.() ?? String(property.owner ?? "");
  const userId =
    session.user.id?.toString?.() ?? String(session.user.id ?? "");
  return Boolean(ownerId && userId && ownerId === userId);
}
