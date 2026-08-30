import User from "@/models/User";

/** Defaults when a User has no preferences document yet. */
export const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  bookingUpdates: true,
  hostNewBookings: true,
  hostBookingChanges: true,
});

/**
 * Normalize raw DB / request notification prefs into a full boolean map.
 * Unknown keys are ignored; missing keys fall back to defaults.
 */
export function normalizeNotificationPrefs(raw) {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    bookingUpdates:
      typeof src.bookingUpdates === "boolean"
        ? src.bookingUpdates
        : DEFAULT_NOTIFICATION_PREFS.bookingUpdates,
    hostNewBookings:
      typeof src.hostNewBookings === "boolean"
        ? src.hostNewBookings
        : DEFAULT_NOTIFICATION_PREFS.hostNewBookings,
    hostBookingChanges:
      typeof src.hostBookingChanges === "boolean"
        ? src.hostBookingChanges
        : DEFAULT_NOTIFICATION_PREFS.hostBookingChanges,
  };
}

/**
 * Load notification prefs for a user email. Unknown / missing users → defaults (opt-in).
 * @param {string|null|undefined} email
 */
export async function getNotificationPrefsByEmail(email) {
  if (!email || typeof email !== "string") {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ...DEFAULT_NOTIFICATION_PREFS };

  try {
    // Booking payloads may differ in email casing from User.email
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: new RegExp(`^${escaped}$`, "i"),
    })
      .select("preferences.notifications")
      .lean();
    return normalizeNotificationPrefs(user?.preferences?.notifications);
  } catch (err) {
    console.error("[notification prefs] lookup failed:", err?.message || err);
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

/**
 * Which pref key applies to guest vs host for a booking email kind.
 * @param {"confirmation"|"modified"|"cancelled"} kind
 */
export function prefKeysForEmailKind(kind) {
  if (kind === "confirmation") {
    return { guest: "bookingUpdates", host: "hostNewBookings" };
  }
  // modify + cancel share hostBookingChanges for hosts
  return { guest: "bookingUpdates", host: "hostBookingChanges" };
}

/**
 * Strip recipient emails when the user opted out of that notification type.
 * Force-resend paths should set skipNotificationPrefs on the payload instead.
 *
 * @param {object} payload — booking email payload (mutates a shallow copy)
 * @param {"confirmation"|"modified"|"cancelled"} kind
 * @returns {Promise<object>} payload with emails cleared when opted out;
 *   `_notificationPrefs.guestOptedOut` / `hostOptedOut` set for status tracking
 */
export async function applyNotificationPrefsToEmailPayload(payload, kind) {
  if (!payload || payload.skipNotificationPrefs === true) {
    return {
      ...payload,
      _notificationPrefs: { guestOptedOut: false, hostOptedOut: false },
    };
  }

  const keys = prefKeysForEmailKind(kind);
  const next = { ...payload };
  let guestOptedOut = false;
  let hostOptedOut = false;

  if (next.guestEmail) {
    const guestPrefs = await getNotificationPrefsByEmail(next.guestEmail);
    if (!guestPrefs[keys.guest]) {
      console.info("[booking email] Guest opted out", {
        kind,
        pref: keys.guest,
      });
      next.guestEmail = undefined;
      guestOptedOut = true;
    }
  }

  if (next.hostEmail) {
    const hostPrefs = await getNotificationPrefsByEmail(next.hostEmail);
    if (!hostPrefs[keys.host]) {
      console.info("[booking email] Host opted out", {
        kind,
        pref: keys.host,
      });
      next.hostEmail = undefined;
      hostOptedOut = true;
    }
  }

  next._notificationPrefs = { guestOptedOut, hostOptedOut };
  return next;
}
