import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { deleteOwnedProperty } from "@/utils/properties/deleteOwnedProperty";
import { isOpsStaff } from "@/utils/opsAuth";

/**
 * DELETE /api/properties/[id]
 * Hard-deletes a listing.
 * - Host: verified + ownership required
 * - Admin / superadmin: may delete any listing
 */
export async function DELETE(_request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getServerSession(authOptions);
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
