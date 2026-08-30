import mongoose from "mongoose";
import User from "@/models/User";

/**
 * Attach public host identity (`host: { id, name, image }`) from User by Property.owner.
 * Missing/invalid owners are left as host: null — never throws for list rendering.
 *
 * @param {object|object[]} properties — already serialized client props
 * @returns {Promise<object|object[]>}
 */
export async function attachOwnerProfiles(properties) {
  const single = !Array.isArray(properties);
  const list = single ? [properties] : properties;

  if (!list.length) return single ? list[0] : list;

  const ownerIds = [
    ...new Set(
      list
        .map((p) => (p?.owner != null ? String(p.owner) : ""))
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  ];

  /** @type {Map<string, { id: string, name: string|null, image: string|null }>} */
  const byId = new Map();

  if (ownerIds.length) {
    try {
      const users = await User.find({ _id: { $in: ownerIds } })
        .select("username image")
        .lean();
      for (const u of users) {
        byId.set(String(u._id), {
          id: String(u._id),
          name: u.username || null,
          image: u.image || null,
        });
      }
    } catch (err) {
      console.error("attachOwnerProfiles failed:", err?.message || err);
    }
  }

  const enriched = list.map((p) => {
    const ownerKey = p?.owner != null ? String(p.owner) : "";
    const host = byId.get(ownerKey) || null;
    return { ...p, host };
  });

  return single ? enriched[0] : enriched;
}
