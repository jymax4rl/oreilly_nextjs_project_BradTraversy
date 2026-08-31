import Booking from "@/models/Booking";
import Property from "@/models/Property";
import User from "@/models/User";

/**
 * Assemble a safe public profile for the signed-in user.
 * Counts are best-effort: a failed count returns null so the page still loads.
 * Never includes secrets, OAuth tokens, or hostAddress internals.
 *
 * @param {{ email: string, id?: string }} sessionUser
 * @returns {Promise<object|null>}
 */
export async function getProfilePayload(sessionUser) {
  if (!sessionUser?.email) return null;

  const user = await User.findOne({ email: sessionUser.email })
    .select(
      "username email image role hostStatus hasCompletedHostOnboarding bookmarks createdAt updatedAt",
    )
    .lean();

  if (!user) return null;

  const userId = String(user._id);
  const today = new Date().toISOString().slice(0, 10);

  const [bookingsTotal, bookingsUpcoming, bookingsPast, listingsCount] =
    await Promise.all([
      safeCount(() =>
        Booking.countDocuments({
          guestId: userId,
          status: { $in: ["confirmed", "pending", "cancelled"] },
        }),
      ),
      safeCount(() =>
        Booking.countDocuments({
          guestId: userId,
          status: { $in: ["confirmed", "pending"] },
          checkIn: { $gte: today },
        }),
      ),
      safeCount(() =>
        Booking.countDocuments({
          guestId: userId,
          status: "confirmed",
          checkOut: { $lt: today },
        }),
      ),
      // Listings only meaningful for hosts; still cheap for guests (usually 0).
      safeCount(() => Property.countDocuments({ owner: userId })),
    ]);

  const role = user.role || "guest";
  const hostStatus = user.hostStatus || "none";

  return {
    id: userId,
    name: user.username || "",
    email: user.email,
    image: user.image || null,
    role,
    roles: {
      guest:
        role === "guest" ||
        role === "host" ||
        role === "admin" ||
        role === "superadmin",
      host: role === "host" || hostStatus === "verified",
      admin: role === "admin" || role === "superadmin",
    },
    hostStatus,
    hasCompletedHostOnboarding: !!user.hasCompletedHostOnboarding,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
    counts: {
      bookings: bookingsTotal,
      bookingsUpcoming,
      bookingsPast,
      listings: listingsCount,
      saved: Array.isArray(user.bookmarks) ? user.bookmarks.length : 0,
    },
  };
}

async function safeCount(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("profile count failed:", err?.message || err);
    return null;
  }
}
