import { cloudinary, isCloudinaryConfigured } from "./cloudinary.js";
import { propertyFolder } from "./generateFolderPath.js";

/**
 * Best-effort Cloudinary cleanup for a listing.
 * Collects publicIds from image/audio entries; also attempts folder delete by prefix.
 * Failures are logged and swallowed so the DB hard-delete can still succeed.
 */
export async function deletePropertyCloudinaryMedia({
  hostId,
  propertyId,
  images = [],
  audio = null,
}) {
  if (!isCloudinaryConfigured()) return;

  const publicIds = [];
  for (const entry of images || []) {
    const id =
      typeof entry === "object" && entry?.publicId
        ? String(entry.publicId)
        : null;
    if (id) publicIds.push(id);
  }
  if (audio && typeof audio === "object" && audio.publicId) {
    publicIds.push(String(audio.publicId));
  }

  try {
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds, {
        resource_type: "image",
      });
    }
  } catch (error) {
    console.error("Cloudinary image delete warning:", error?.message || error);
  }

  try {
    if (audio && typeof audio === "object" && audio.publicId) {
      await cloudinary.api.delete_resources([String(audio.publicId)], {
        resource_type: "video",
      });
    }
  } catch (error) {
    console.error("Cloudinary audio delete warning:", error?.message || error);
  }

  // Prefix delete covers leftovers under the property folder tree.
  try {
    if (hostId && propertyId) {
      const folder = propertyFolder(hostId, propertyId);
      await cloudinary.api.delete_resources_by_prefix(folder);
      try {
        await cloudinary.api.delete_folder(folder);
      } catch {
        // Folder may already be empty / missing after prefix delete.
      }
    }
  } catch (error) {
    console.error("Cloudinary folder delete warning:", error?.message || error);
  }
}
