import TrafficDay from "@/models/TrafficDay";
import TrafficSession from "@/models/TrafficSession";

const SID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SESSION_TTL_MS = 48 * 60 * 60 * 1000;
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|twitterbot/i;

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isValidTrafficSid(sid) {
  return typeof sid === "string" && SID_RE.test(sid);
}

export function isLikelyBot(userAgent) {
  return typeof userAgent === "string" && BOT_RE.test(userAgent);
}

/**
 * Record one anonymous probe. Heartbeats only refresh presence; views
 * increment on kind=view so a tab left open does not inflate page views.
 * Does not store IP or account ids.
 */
export async function recordTrafficHit({ sid, kind }) {
  if (!isValidTrafficSid(sid)) return { ok: false, error: "invalid_sid" };

  const now = new Date();
  const dayKey = utcDayKey(now);
  const expireAt = new Date(now.getTime() + SESSION_TTL_MS);
  let isView = kind === "view";

  const existing = await TrafficSession.findById(sid).select("lastSeen").lean();
  // Ignore duplicate mounts (React Strict Mode) so one open does not count twice.
  if (
    isView &&
    existing?.lastSeen &&
    now.getTime() - new Date(existing.lastSeen).getTime() < 3000
  ) {
    isView = false;
  }

  await TrafficSession.findByIdAndUpdate(
    sid,
    { $set: { lastSeen: now, dayKey, expireAt } },
    { upsert: true },
  );

  if (isView) {
    await TrafficDay.findByIdAndUpdate(
      dayKey,
      { $inc: { views: 1 } },
      { upsert: true },
    );
  }

  return { ok: true };
}
