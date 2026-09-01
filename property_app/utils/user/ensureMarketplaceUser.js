import User from "@/models/User";

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function emailMatchQuery(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { email: { $regex: new RegExp(`^${escaped}$`, "i") } };
}

function isObjectIdString(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

function displayNameFrom({ name, email }) {
  const fromName = String(name || "").trim();
  if (fromName) return fromName;
  const fromEmail = String(normalizeEmail(email).split("@")[0] || "").trim();
  return fromEmail || "Guest";
}

/**
 * Find the marketplace user for a NextAuth session (id, then email).
 * Google JWTs can exist even when the Mongo user was never created.
 */
export async function findMarketplaceUser(sessionUser = {}) {
  if (isObjectIdString(sessionUser.id)) {
    const byId = await User.findById(sessionUser.id);
    if (byId) return byId;
  }

  const query = emailMatchQuery(sessionUser.email);
  if (!query) return null;
  return User.findOne(query);
}

/**
 * Find or create the Mongo user for a signed-in Google guest.
 * Stores email in lowercase so later lookups stay stable.
 */
export async function ensureMarketplaceUser({
  email,
  name,
  image,
  id,
} = {}) {
  const existing = await findMarketplaceUser({ id, email });
  if (existing) return existing;

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  try {
    return await User.create({
      email: normalized,
      username: displayNameFrom({ name, email: normalized }),
      image: image || undefined,
      role: "guest",
      hostStatus: "none",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return User.findOne(emailMatchQuery(normalized));
    }
    throw error;
  }
}
