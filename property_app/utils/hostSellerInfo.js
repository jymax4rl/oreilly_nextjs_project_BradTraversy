import HostApplication from "@/models/HostApplication";
import User from "@/models/User";

/**
 * Contact block stored on listings — sourced from the verified host account.
 * @param {string} hostId MongoDB user id (property.owner)
 */
export async function resolveSellerInfoForHost(hostId) {
  const user = await User.findById(hostId).lean();
  if (!user) {
    throw new Error("Host account not found.");
  }

  const application = await HostApplication.findOne({ user: hostId }).lean();

  return {
    name: String(user.username || "").trim(),
    email: String(user.email || "").trim(),
    phone: String(application?.phone || "").trim(),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Optional per-listing email/phone; name always stays on the host profile.
 * @param {{ name: string, email: string, phone: string }} base
 * @param {{ mode?: string, email?: string, phone?: string } | null | undefined} contact
 */
export function applyListingContactChoice(base, contact) {
  const merged = { ...base };
  if (contact?.mode !== "custom") {
    return merged;
  }
  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();
  if (email) merged.email = email;
  if (phone) merged.phone = phone;
  return merged;
}

/**
 * @param {{ name: string, email: string, phone?: string }} sellerInfo
 * @param {{ mode?: string, email?: string, phone?: string } | null | undefined} [contact]
 */
export function validateHostSellerInfo(sellerInfo, contact) {
  if (!sellerInfo.name) {
    return "Your host profile is missing a display name.";
  }
  if (!sellerInfo.email) {
    return "Your account has no email. Add one under custom contact or update your profile.";
  }
  if (contact?.mode === "custom") {
    const customEmail = String(contact.email || "").trim();
    if (customEmail && !EMAIL_RE.test(customEmail)) {
      return "Enter a valid email address for guest contact.";
    }
  }
  return null;
}
