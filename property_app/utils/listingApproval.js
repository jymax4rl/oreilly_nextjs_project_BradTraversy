/**
 * Listing moderation: only *new* submissions set `listingModerationRequestedAt`
 * with `listingStatus: "pending"`. Existing DB rows without that timestamp are
 * not treated as awaiting moderation (they cannot be "pending" in the queue).
 */

/** True when this listing is in the admin moderation queue (new submission). */
export function isAwaitingListingModeration(property) {
  if (!property || property.listingStatus !== "pending") return false;
  return Boolean(property.listingModerationRequestedAt);
}

export function approvedListingQuery() {
  return {
    $or: [
      { listingStatus: "approved" },
      { listingStatus: { $exists: false } },
      { listingStatus: null },
      // Invalid/legacy: pending without a moderation request — treat as public like approved
      {
        listingStatus: "pending",
        listingModerationRequestedAt: { $exists: false },
      },
      { listingStatus: "pending", listingModerationRequestedAt: null },
    ],
  };
}

/** Admin "Pending" tab: only new submissions that requested moderation. */
export function pendingModerationQueueQuery() {
  return {
    listingStatus: "pending",
    listingModerationRequestedAt: { $exists: true, $ne: null },
  };
}

export function isPubliclyVisibleListing(property) {
  if (!property) return false;
  if (isAwaitingListingModeration(property)) return false;
  if (property.listingStatus === "rejected") return false;
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
