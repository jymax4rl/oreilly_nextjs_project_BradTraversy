import Property from "@/models/Property";
import PropertyAvailability from "@/models/PropertyAvailability";
import Message from "@/models/Message";
import User from "@/models/User";
import { deletePropertyCloudinaryMedia } from "@/utils/cloudinary/deletePropertyMedia";

/**
 * Permanently removes a property.
 *
 * By default requires `actorId` to match `property.owner`. Pass `{ asOps: true }`
 * for admin/superadmin deletes of any listing (ownership check skipped).
 *
 * Cleans listing-coupled data (availability, messages, bookmarks, Cloudinary media).
 * Leaves Booking / Transaction rows intact for payment/history audit trails —
 * there is no existing cascade for those in the codebase.
 *
 * @param {string} propertyId
 * @param {string} actorId — host owner id, or ops user id when `asOps`
 * @param {{ asOps?: boolean }} [options]
 * @returns {{ ok: true, propertyId: string } | { ok: false, status: number, error: string }}
 */
export async function deleteOwnedProperty(propertyId, actorId, options = {}) {
  const { asOps = false } = options;

  if (!propertyId || !actorId) {
    return {
      ok: false,
      status: 400,
      error: "Property id and actor are required.",
    };
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return { ok: false, status: 404, error: "Property not found." };
  }

  if (!asOps && String(property.owner) !== String(actorId)) {
    return {
      ok: false,
      status: 403,
      error: "Only the property owner can delete this listing.",
    };
  }

  const hostId = String(property.owner);
  const id = property._id.toString();
  const images = property.images || [];
  const audio = property.audio || null;

  // Media first (best-effort) so orphaned Cloudinary assets are less likely
  // if DB deletes succeed but a later step would have cleaned media.
  await deletePropertyCloudinaryMedia({
    hostId,
    propertyId: id,
    images,
    audio,
  });

  await PropertyAvailability.deleteMany({ propertyId: property._id }).catch(
    (err) => console.error("Availability cleanup warning:", err),
  );

  // Messages may store property as ObjectId or string depending on create path.
  await Message.deleteMany({
    $or: [{ property: property._id }, { property: id }],
  }).catch((err) => console.error("Message cleanup warning:", err));

  await User.updateMany(
    { bookmarks: property._id },
    { $pull: { bookmarks: property._id } },
  ).catch((err) => console.error("Bookmark cleanup warning:", err));

  await property.deleteOne();

  return { ok: true, propertyId: id };
}
