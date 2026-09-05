import webpush from "web-push";
import User from "@/models/User";
import { normalizeNotificationPrefs } from "@/utils/user/notificationPrefs";

const MAX_SUBSCRIPTIONS = 8;

function vapidConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function applyVapid() {
  if (!vapidConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@isisel.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  return true;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

function stayLabel(checkIn, checkOut) {
  const a = String(checkIn || "").slice(0, 10);
  const b = String(checkOut || "").slice(0, 10);
  if (a && b) return `${a} → ${b}`;
  return a || "";
}

/**
 * Persist a PushSubscription JSON for the signed-in user.
 */
export async function savePushSubscription(userId, subscription) {
  const endpoint = String(subscription?.endpoint || "").trim();
  const p256dh = String(subscription?.keys?.p256dh || "").trim();
  const auth = String(subscription?.keys?.auth || "").trim();
  if (!userId || !endpoint || !p256dh || !auth) {
    return { ok: false, error: "Invalid subscription" };
  }

  const entry = {
    endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: { p256dh, auth },
    updatedAt: new Date(),
  };

  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } },
  );
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        pushSubscriptions: {
          $each: [entry],
          $slice: -MAX_SUBSCRIPTIONS,
        },
      },
    },
  );
  return { ok: true };
}

export async function removePushSubscription(userId, endpoint) {
  if (!userId || !endpoint) return { ok: false };
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint: String(endpoint) } } },
  );
  return { ok: true };
}

async function dropDeadEndpoint(userId, endpoint) {
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } },
  );
}

/**
 * Lock-screen / notification-shade alert for a host on a new reservation.
 * No-ops when VAPID is unset, the host has no devices, or they opted out.
 */
export async function notifyHostNewReservation({
  hostUserId,
  propertyName,
  guestName,
  checkIn,
  checkOut,
  bookingId,
  status,
}) {
  if (!hostUserId || !applyVapid()) return { sent: 0, skipped: "unconfigured" };

  const host = await User.findById(hostUserId)
    .select("pushSubscriptions preferences.notifications")
    .lean();
  if (!host) return { sent: 0, skipped: "no-host" };

  const prefs = normalizeNotificationPrefs(host.preferences?.notifications);
  if (!prefs.hostNewBookings) return { sent: 0, skipped: "opted-out" };

  const subs = Array.isArray(host.pushSubscriptions)
    ? host.pushSubscriptions
    : [];
  if (subs.length === 0) return { sent: 0, skipped: "no-devices" };

  const stay = stayLabel(checkIn, checkOut);
  const guest = String(guestName || "Guest").trim() || "Guest";
  const listing = String(propertyName || "your listing").trim();
  const pending = status === "pending";
  const payload = JSON.stringify({
    title: pending ? "New reservation request" : "New reservation",
    body: [guest, listing, stay].filter(Boolean).join(" · "),
    url: "/host",
    tag: bookingId ? `booking-${bookingId}` : "reservation",
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            expirationTime: sub.expirationTime,
            keys: sub.keys,
          },
          payload,
          { TTL: 60 * 60 * 24 },
        );
        sent += 1;
      } catch (err) {
        const code = err?.statusCode;
        if (code === 404 || code === 410) {
          await dropDeadEndpoint(host._id, sub.endpoint);
        } else {
          console.error("[web-push] send failed:", code || err?.message || err);
        }
      }
    }),
  );

  return { sent };
}
