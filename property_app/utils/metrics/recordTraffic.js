import TrafficBucket from "@/models/TrafficBucket";
import TrafficDay from "@/models/TrafficDay";
import TrafficSession from "@/models/TrafficSession";
import { jitterFromSid } from "@/utils/metrics/trafficGeo";
import {
  BUCKET_TTL_MS,
  trafficBucketId,
} from "@/utils/metrics/trafficBuckets";

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
 * Does not store IP or account ids. Optional geo is city-level only.
 */
export async function recordTrafficHit({ sid, kind, geo }) {
  if (!isValidTrafficSid(sid)) return { ok: false, error: "invalid_sid" };

  const now = new Date();
  const dayKey = utcDayKey(now);
  const expireAt = new Date(now.getTime() + SESSION_TTL_MS);
  let isView = kind === "view";

  const existing = await TrafficSession.findById(sid)
    .select("lastSeen lat geoSource")
    .lean();
  // Ignore duplicate mounts (React Strict Mode) so one open does not count twice.
  if (
    isView &&
    existing?.lastSeen &&
    now.getTime() - new Date(existing.lastSeen).getTime() < 3000
  ) {
    isView = false;
  }

  const set = { lastSeen: now, dayKey, expireAt };
  const hasGeo =
    geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng);
  // Pin once from timezone; upgrade to Vercel coords when those headers exist.
  const shouldSetGeo =
    hasGeo &&
    (existing?.lat == null ||
      (geo.source === "vercel" && existing?.geoSource !== "vercel"));
  if (shouldSetGeo) {
    const jittered = jitterFromSid(sid, geo.lat, geo.lng);
    set.lat = jittered.lat;
    set.lng = jittered.lng;
    if (geo.country) set.country = String(geo.country).slice(0, 2);
    if (geo.city) set.city = String(geo.city).slice(0, 80);
    if (geo.source) set.geoSource = geo.source;
  }

  await TrafficSession.findByIdAndUpdate(sid, { $set: set }, { upsert: true });

  /**
   * Page views increment two counters: the UTC calendar-day total and the
   * current 15-minute bucket used by the ops curve. Heartbeats skip both.
   */
  if (isView) {
    const bucketId = trafficBucketId(now);
    await Promise.all([
      TrafficDay.findByIdAndUpdate(
        dayKey,
        { $inc: { views: 1 } },
        { upsert: true },
      ),
      TrafficBucket.findByIdAndUpdate(
        bucketId,
        {
          $inc: { views: 1 },
          $set: { expireAt: new Date(now.getTime() + BUCKET_TTL_MS) },
        },
        { upsert: true },
      ),
    ]);
  }

  return { ok: true };
}
