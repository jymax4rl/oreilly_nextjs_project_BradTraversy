import mongoose from "mongoose";
import User from "@/models/User";

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = typeof v === "string" ? v.trim() : String(v).trim();
    if (s) return s;
  }
  return undefined;
}

/**
 * Host inbox for booking mail: listing `seller_info` first, then the owner's
 * User email. Newly enrolled hosts often have a Google email on User but an
 * empty `seller_info.email`, which used to skip host confirmation entirely.
 *
 * @param {object|null|undefined} property
 * @param {object} [extras]
 * @returns {Promise<{ hostEmail?: string, hostName?: string }>}
 */
export async function resolveHostContact(property, extras = {}) {
  let hostEmail = firstNonEmpty(
    extras.hostEmail,
    extras.host_email,
    property?.seller_info?.email,
  );
  let hostName = firstNonEmpty(
    extras.hostName,
    extras.host_name,
    property?.seller_info?.name,
  );

  const ownerId = property?.owner;
  if (
    (!hostEmail || !hostName) &&
    ownerId &&
    mongoose.Types.ObjectId.isValid(String(ownerId))
  ) {
    try {
      const owner = await User.findById(ownerId).select("email username").lean();
      if (owner) {
        hostEmail = firstNonEmpty(hostEmail, owner.email);
        hostName = firstNonEmpty(hostName, owner.username);
      }
    } catch (err) {
      console.error("[booking email] Owner lookup failed:", err?.message || err);
    }
  }

  return { hostEmail, hostName };
}

export { firstNonEmpty as firstNonEmptyHostField };
