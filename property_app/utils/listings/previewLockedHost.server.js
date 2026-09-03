import User from "@/models/User";
import {
  PREVIEW_LOCKED_HOST_EMAILS,
  PREVIEW_LOCKED_HOST_NAMES,
  isPreviewLockedHost,
} from "@/utils/listings/previewLockedHost";

function emailExactRegex(email) {
  const escaped = String(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

export async function findPreviewLockedOwnerIds() {
  const or = [
    ...PREVIEW_LOCKED_HOST_EMAILS.map((email) => ({
      email: { $regex: emailExactRegex(email) },
    })),
    ...PREVIEW_LOCKED_HOST_NAMES.map((name) => ({
      username: {
        $regex: new RegExp(
          `^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
    })),
  ];
  if (!or.length) return [];

  const users = await User.find({ $or: or }).select("_id").lean();
  return users.map((user) => String(user._id));
}

export async function isListingPreviewLocked(property) {
  if (!property) return false;
  if (property.previewLocked === true) return true;
  if (
    isPreviewLockedHost({
      email: property.seller_info?.email,
      name: property.seller_info?.name,
    })
  ) {
    return true;
  }

  const ownerId = property.owner?.toString?.() ?? String(property.owner ?? "");
  if (!ownerId) return false;

  const owner = await User.findById(ownerId).select("email username").lean();
  return isPreviewLockedHost({
    email: owner?.email,
    name: owner?.username,
  });
}
