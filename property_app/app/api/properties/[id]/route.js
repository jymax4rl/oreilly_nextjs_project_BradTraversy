import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

/** Remove a draft listing when direct Cloudinary uploads fail after create. */
export async function DELETE(_request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const propertyId = String(id || "");
    if (!propertyId) {
      return new Response("Missing property id", { status: 400 });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return new Response("Not found", { status: 404 });
    }
    if (String(property.owner) !== String(session.user.id)) {
      return new Response("Forbidden", { status: 403 });
    }

    const hasImages = Array.isArray(property.images) && property.images.length > 0;
    if (hasImages) {
      return new Response("Cannot delete listing with media", { status: 400 });
    }

    await Property.findByIdAndDelete(propertyId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete draft property", error);
    return new Response("Failed to delete listing", { status: 500 });
  }
}
