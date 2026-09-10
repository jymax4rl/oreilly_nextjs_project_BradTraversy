import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { getSettingsPayload } from "@/utils/user/getSettingsPayload";
import {
  DEFAULT_NOTIFICATION_PREFS,
  normalizeNotificationPrefs,
} from "@/utils/user/notificationPrefs";
import { normalizeHostCancellationSettings } from "@/utils/bookings/bookingPolicy";

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
 * PATCH /api/user/settings
 * Body:
 *   { notifications: { … } }
 *   and/or { defaultCancellationPolicy: { preset, customHours?, timeZone? } }
 * Cancellation policy updates are limited to verified hosts (and admins).
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

    const allowedTop = new Set(["notifications", "defaultCancellationPolicy"]);
    const extra = Object.keys(body || {}).filter((k) => !allowedTop.has(k));
    if (extra.length > 0) {
      return new Response(`Unsupported fields: ${extra.join(", ")}`, {
        status: 400,
      });
    }

    const hasNotifications =
      body?.notifications && typeof body.notifications === "object";
    const hasCancellation = body?.defaultCancellationPolicy !== undefined;

    if (!hasNotifications && !hasCancellation) {
      return new Response(
        "notifications or defaultCancellationPolicy required",
        { status: 400 },
      );
    }

    const $set = {};

    if (hasNotifications) {
      const incoming = body.notifications;
      const unknown = Object.keys(incoming).filter(
        (k) => !NOTIFICATION_KEYS.includes(k),
      );
      if (unknown.length > 0) {
        return new Response(
          `Unsupported notification keys: ${unknown.join(", ")}`,
          { status: 400 },
        );
      }
      for (const key of NOTIFICATION_KEYS) {
        if (incoming[key] === undefined) continue;
        if (typeof incoming[key] !== "boolean") {
          return new Response(`${key} must be a boolean`, { status: 400 });
        }
        $set[`preferences.notifications.${key}`] = incoming[key];
      }
    }

    if (hasCancellation) {
      const user = await User.findOne({ email: session.user.email })
        .select("role hostStatus")
        .lean();
      if (!user) {
        return new Response("User not found", { status: 404 });
      }
      const isVerifiedHost =
        user.hostStatus === "verified" || user.role === "host";
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      if (!isVerifiedHost && !isAdmin) {
        return new Response(
          "Only verified hosts can update cancellation policy",
          { status: 403 },
        );
      }
      if (
        !body.defaultCancellationPolicy ||
        typeof body.defaultCancellationPolicy !== "object"
      ) {
        return new Response("defaultCancellationPolicy must be an object", {
          status: 400,
        });
      }
      $set.defaultCancellationPolicy = normalizeHostCancellationSettings(
        body.defaultCancellationPolicy,
      );
    }

    if (Object.keys($set).length === 0) {
      return new Response("No valid fields provided", { status: 400 });
    }

    const result = await User.updateOne(
      { email: session.user.email },
      { $set },
    );

    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    const settings = await getSettingsPayload(session.user);
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
