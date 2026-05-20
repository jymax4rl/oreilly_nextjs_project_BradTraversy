import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  hostRootFolder,
  propertyFolder,
  propertyImagesFolder,
} from "@/utils/cloudinary/generateFolderPath";

async function requireVerifiedHost() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  if (session.user.hostStatus !== "verified") {
    return {
      error: new Response(
        "Access denied. Only verified hosts can list properties.",
        { status: 403 },
      ),
    };
  }
  return { hostId: String(session.user.id) };
}

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const auth = await requireVerifiedHost();
    if (auth.error) return auth.error;

    const propertyId = String(params.id || "");
    const property = await Property.findById(propertyId);
    if (!property) {
      return new Response("Property not found", { status: 404 });
    }
    if (String(property.owner) !== auth.hostId) {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const images = Array.isArray(body.images) ? body.images : [];
    const audio = body.audio || null;

    if (images.length < 1 && !audio) {
      return new Response("Add at least one property photo.", { status: 400 });
    }

    const hostId = auth.hostId;
    const listingFolder = propertyFolder(hostId, propertyId);
    const imagesFolder = propertyImagesFolder(hostId, propertyId);

    const update = {
      cloudinaryFolder: listingFolder,
      cloudinaryImagesFolder: imagesFolder,
      cloudinaryMigrationStatus: "completed",
    };

    if (images.length > 0) {
      update.images = images.map((entry) => ({
        url: entry.url,
        publicId: entry.publicId,
        resourceType: entry.resourceType || "image",
        uploadedAt: entry.uploadedAt ? new Date(entry.uploadedAt) : new Date(),
      }));
    }

    if (audio?.url && audio?.publicId) {
      update.audio = {
        url: audio.url,
        publicId: audio.publicId,
        resourceType: audio.resourceType || "video",
      };
    }

    await Property.findByIdAndUpdate(propertyId, { $set: update });
    await User.findByIdAndUpdate(hostId, {
      $set: { cloudinaryRootFolder: hostRootFolder(hostId) },
    });

    return Response.json({ ok: true, propertyId });
  } catch (error) {
    console.error("Failed to attach property media", error);
    return new Response("Failed to save photos.", { status: 500 });
  }
}
