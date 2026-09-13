import connectToDatabase from "@/config/database";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { deleteOwnedProperty } from "@/utils/properties/deleteOwnedProperty";
import { isOpsStaff } from "@/utils/opsAuth";
import { canUserViewListing } from "@/utils/listingApproval";
import {
  ensurePropertySlug,
  findPropertyByParam,
} from "@/utils/listings/propertySlug";
import { serializePropertyForApi } from "@/utils/listings/serializePropertyForApi";
import { attachOwnerProfiles } from "@/utils/user/attachOwnerProfiles";
import {
  canUnlockPreviewListing,
  isListingOwner,
  redactPreviewLockedCatalogFields,
} from "@/utils/listings/previewLockedHost";
import { isListingPreviewLocked } from "@/utils/listings/previewLockedHost.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/properties/[id] — public detail (no auth required).
 * `[id]` accepts Mongo ObjectId or public slug (same as /properties/[id] pages).
 *
 * Visibility matches web detail:
 * - approved / legacy-public listings are viewable
 * - pending moderation queue + rejected → 404 (unless owner or ops via session)
 * - preview-locked hosts → 404 unless ops unlock or owner
 *
 * Shape: { property }
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const found = await findPropertyByParam(id, "-internalNotes");
    if (!found) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const property = await ensurePropertySlug(found);
    const session = await getAuthFromRequest(request);

    if (!canUserViewListing(property, session)) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    let serialized = await attachOwnerProfiles(
      serializePropertyForApi(property),
    );

    const previewLocked =
      Boolean(serialized.previewLocked) ||
      (await isListingPreviewLocked(property));

    if (
      previewLocked &&
      !canUnlockPreviewListing(session) &&
      !isListingOwner(session, serialized)
    ) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (previewLocked) {
      [serialized] = redactPreviewLockedCatalogFields([serialized]);
    }

    return Response.json({ property: serialized });
  } catch (error) {
    console.error("GET /api/properties/[id]:", error);
    return Response.json(
      { error: "Failed to load property" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/properties/[id]
 * Hard-deletes a listing.
 * - Host: verified + ownership required
 * - Admin / superadmin: may delete any listing
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const asOps = isOpsStaff(session.user.role);

    if (!asOps) {
      const verified = assertVerifiedHost(session);
      if (!verified.ok) {
        return Response.json(
          { error: verified.message },
          { status: verified.status },
        );
      }
    }

    const result = await deleteOwnedProperty(id, session.user.id, { asOps });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({
      success: true,
      propertyId: result.propertyId,
      message: "Property permanently deleted.",
    });
  } catch (error) {
    console.error("DELETE property:", error);
    return Response.json(
      { error: "Failed to delete property. Please try again." },
      { status: 500 },
    );
  }
}
