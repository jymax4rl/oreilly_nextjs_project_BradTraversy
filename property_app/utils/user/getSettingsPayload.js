import User from "@/models/User";
import { normalizeNotificationPrefs } from "@/utils/user/notificationPrefs";

/**
 * Safe settings snapshot for the signed-in user (no secrets / hostAddress).
 * Mirrors role flags from profile so Settings can gate sections server-side.
 *
 * @param {{ email: string, id?: string }} sessionUser
 * @returns {Promise<object|null>}
 */
export async function getSettingsPayload(sessionUser) {
  if (!sessionUser?.email) return null;

  const user = await User.findOne({ email: sessionUser.email })
    .select(
      "username email image role hostStatus hasCompletedHostOnboarding preferences createdAt",
    )
    .lean();

  if (!user) return null;

  const role = user.role || "guest";
  const hostStatus = user.hostStatus || "none";
  const isVerifiedHost = hostStatus === "verified" || role === "host";
  const isAdmin = role === "admin" || role === "superadmin";

  return {
    id: String(user._id),
    name: user.username || "",
    email: user.email,
    image: user.image || null,
    role,
    roles: {
      // Everyone can book; host/admin flags gate hosting & admin sections.
      guest: true,
      host: isVerifiedHost,
      admin: isAdmin,
    },
    hostStatus,
    hasCompletedHostOnboarding: !!user.hasCompletedHostOnboarding,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    preferences: {
      notifications: normalizeNotificationPrefs(
        user.preferences?.notifications,
      ),
    },
    /** Auth is Google-only today — Settings surfaces this honestly (no password UI). */
    auth: {
      provider: "google",
      label: "Google",
    },
  };
}
