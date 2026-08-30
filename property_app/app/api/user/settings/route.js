import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { getSettingsPayload } from "@/utils/user/getSettingsPayload";
import {
  DEFAULT_NOTIFICATION_PREFS,
  normalizeNotificationPrefs,
} from "@/utils/user/notificationPrefs";

const NOTIFICATION_KEYS = Object.keys(DEFAULT_NOTIFICATION_PREFS);

/**
 * GET /api/user/settings — authenticated settings snapshot.
 */
export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const settings = await getSettingsPayload(session.user);
    if (!settings) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json({ settings });
  } catch (error) {
    console.error("GET /api/user/settings error:", error);
    return new Response("Failed to load settings", { status: 500 });
  }
};

/**
 * PATCH /api/user/settings — update notification preferences only.
 * Body: { notifications: { bookingUpdates?, hostNewBookings?, hostBookingChanges? } }
 * Host-only keys are accepted for any user (harmless if guest) so clients can
 * send a partial map; UI only shows host toggles to verified hosts.
 */
export const PATCH = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const allowedTop = new Set(["notifications"]);
    const extra = Object.keys(body || {}).filter((k) => !allowedTop.has(k));
    if (extra.length > 0) {
      return new Response(`Unsupported fields: ${extra.join(", ")}`, {
        status: 400,
      });
    }

    if (!body?.notifications || typeof body.notifications !== "object") {
      return new Response("notifications object required", { status: 400 });
    }

    const incoming = body.notifications;
    const unknown = Object.keys(incoming).filter(
      (k) => !NOTIFICATION_KEYS.includes(k),
    );
    if (unknown.length > 0) {
      return new Response(`Unsupported notification keys: ${unknown.join(", ")}`, {
        status: 400,
      });
    }

    const $set = {};
    for (const key of NOTIFICATION_KEYS) {
      if (incoming[key] === undefined) continue;
      if (typeof incoming[key] !== "boolean") {
        return new Response(`${key} must be a boolean`, { status: 400 });
      }
      $set[`preferences.notifications.${key}`] = incoming[key];
    }

    if (Object.keys($set).length === 0) {
      return new Response("No notification fields provided", { status: 400 });
    }

    const result = await User.updateOne(
      { email: session.user.email },
      { $set },
    );

    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    const settings = await getSettingsPayload(session.user);
    // Ensure response always has a full notifications map even if DB was sparse
    if (settings?.preferences) {
      settings.preferences.notifications = normalizeNotificationPrefs(
        settings.preferences.notifications,
      );
    }

    return Response.json({ settings });
  } catch (error) {
    console.error("PATCH /api/user/settings error:", error);
    return new Response("Failed to update settings", { status: 500 });
  }
};
