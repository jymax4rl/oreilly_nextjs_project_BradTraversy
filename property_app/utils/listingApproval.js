import { isOpsStaff } from "./opsAuth.js";
import { canBrowseListingCatalog } from "./listings/catalogBeta.js";

/**
 * Listing moderation helpers.
 *
 * Field: Property.status = "pending" | "approved" | "rejected"
 * New submissions also set listingModerationRequestedAt so legacy rows without
 * that timestamp are not trapped in the admin pending queue (and stay public).
 */

/** True when this listing is in the admin moderation queue (new submission). */
export function isAwaitingListingModeration(property) {
  if (!property || property.status !== "pending") return false;
  return Boolean(property.listingModerationRequestedAt);
}

/** Public browse / sitemap: approved, or legacy docs with no real moderation request. */
export function approvedListingQuery() {
  return {
    $or: [
      { status: "approved" },
      { status: { $exists: false } },
      { status: null },
      {
        status: "pending",
        listingModerationRequestedAt: { $exists: false },
      },
      { status: "pending", listingModerationRequestedAt: null },
    ],
  };
}

/** Live on the public website (approved and not ops-hidden). */
export function publicListingQuery() {
  return {
    $and: [approvedListingQuery(), { listed: { $ne: false } }],
  };
}

/** Approved listings a superadmin has hidden from the public site. */
export function hiddenListingQuery() {
  return {
    $and: [approvedListingQuery(), { listed: false }],
  };
}

/** Admin "Pending" tab: only new submissions that requested moderation. */
export function pendingModerationQueueQuery() {
  return {
    status: "pending",
    listingModerationRequestedAt: { $exists: true, $ne: null },
  };
}

export function isPubliclyVisibleListing(property) {
  if (!property) return false;
  if (property.listed === false) return false;
  if (isAwaitingListingModeration(property)) return false;
  if (property.status === "rejected") return false;
  return true;
}

export function canUserViewListing(property, session) {
  if (!property) return false;
  if (!session?.user) {
    return canBrowseListingCatalog(session) && isPubliclyVisibleListing(property);
  }
  if (isOpsStaff(session.user.role)) return true;
  const ownerId =
    property.owner?.toString?.() ?? String(property.owner ?? "");
  const userId =
    session.user.id?.toString?.() ?? String(session.user.id ?? "");
  if (ownerId && userId && ownerId === userId) return true;
  if (!canBrowseListingCatalog(session)) return false;
  return isPubliclyVisibleListing(property);
}

/** Merge public-visibility constraints into an existing Mongo query object. */
export function withApprovedListingFilter(mongoQuery = {}) {
  const publicOnly = publicListingQuery();
  if (!mongoQuery || Object.keys(mongoQuery).length === 0) {
    return publicOnly;
  }
  return { $and: [mongoQuery, publicOnly] };
}
