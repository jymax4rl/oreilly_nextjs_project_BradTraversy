import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { deleteOwnedProperty } from "@/utils/properties/deleteOwnedProperty";

/**
 * DELETE /api/properties/[id]
 * Hard-deletes a listing. Auth + verified host + ownership enforced.
 */
export async function DELETE(_request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json(
        { error: verified.message },
        { status: verified.status },
      );
    }

    const result = await deleteOwnedProperty(id, session.user.id);
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
