import TrafficBucket from "@/models/TrafficBucket";
import TrafficDay from "@/models/TrafficDay";
import TrafficPlaceDay from "@/models/TrafficPlaceDay";
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

/** Inclusive list of UTC `YYYY-MM-DD` keys ending today, oldest first. */
export function utcDayKeys(count, date = new Date()) {
  const n = Math.max(1, Number(count) || 1);
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(utcDayKey(d));
  }
  return keys;
}

export function isValidTrafficSid(sid) {
  return typeof sid === "string" && SID_RE.test(sid);
}

export function isLikelyBot(userAgent) {
  return typeof userAgent === "string" && BOT_RE.test(userAgent);
}

export function normalizeTrafficCity(city) {
  return String(city || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function trafficPlaceDayId(dayKey, country, city) {
  const cc = String(country || "ZZ")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2) || "ZZ";
  const slug = normalizeTrafficCity(city).toLowerCase() || "_";
  return `${dayKey}|${cc}|${slug}`;
}

/**
 * Record one anonymous probe. Heartbeats only refresh presence; views
 * increment on kind=view so a tab left open does not inflate page views.
 * Does not store IP or account ids. Optional geo is city-level only.
 *
 * Daily unique + place totals are written to TrafficDay / TrafficPlaceDay
 * (no TTL). TrafficSession still expires after 48h for the live map.
 */
export async function recordTrafficHit({ sid, kind, geo }) {
  if (!isValidTrafficSid(sid)) return { ok: false, error: "invalid_sid" };

  const now = new Date();
  const dayKey = utcDayKey(now);
  const expireAt = new Date(now.getTime() + SESSION_TTL_MS);
  let isView = kind === "view";

  const existing = await TrafficSession.findById(sid)
    .select("lastSeen lat geoSource country city dayKey geoDayKey")
    .lean();
  // Ignore duplicate mounts (React Strict Mode) so one open does not count twice.
  if (
    isView &&
    existing?.lastSeen &&
    now.getTime() - new Date(existing.lastSeen).getTime() < 3000
  ) {
    isView = false;
  }

  const isNewVisitorToday = !existing || existing.dayKey !== dayKey;

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
    if (geo.city) set.city = normalizeTrafficCity(geo.city);
    if (geo.source) set.geoSource = geo.source;
  }

  const country = set.country || existing?.country || "";
  const city = set.city || existing?.city || "";
  const hasPlace = Boolean(country || city);
  const isNewPlaceVisitorToday =
    hasPlace && existing?.geoDayKey !== dayKey;
  if (isNewPlaceVisitorToday) {
    set.geoDayKey = dayKey;
  }

  await TrafficSession.findByIdAndUpdate(sid, { $set: set }, { upsert: true });

  const writes = [];

  const dayInc = {};
  if (isNewVisitorToday) dayInc.visitors = 1;
  if (isView) dayInc.views = 1;
  if (Object.keys(dayInc).length) {
    writes.push(
      TrafficDay.findByIdAndUpdate(dayKey, { $inc: dayInc }, { upsert: true }),
    );
  }

  /**
   * Page views also increment the current 15-minute bucket used by the ops
   * curve. Heartbeats skip buckets. Unique/place counters above still run on
   * the first heartbeat of a new UTC day so overnight tabs are counted.
   */
  if (isView) {
    const bucketId = trafficBucketId(now);
    writes.push(
      TrafficBucket.findByIdAndUpdate(
        bucketId,
        {
          $inc: { views: 1 },
          $set: { expireAt: new Date(now.getTime() + BUCKET_TTL_MS) },
        },
        { upsert: true },
      ),
    );
  }

  if (hasPlace && (isNewPlaceVisitorToday || isView)) {
    const placeInc = {};
    if (isNewPlaceVisitorToday) placeInc.visitors = 1;
    if (isView) placeInc.views = 1;
    const setOnInsert = {
      dayKey,
      country:
        String(country || "ZZ")
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(0, 2) || "ZZ",
      city: normalizeTrafficCity(city),
    };
    const placeLat = hasGeo ? geo.lat : existing?.lat;
    const placeLng = hasGeo ? geo.lng : existing?.lng;
    if (Number.isFinite(placeLat) && Number.isFinite(placeLng)) {
      setOnInsert.lat = placeLat;
      setOnInsert.lng = placeLng;
    }
    writes.push(
      TrafficPlaceDay.findByIdAndUpdate(
        trafficPlaceDayId(dayKey, country, city),
        { $inc: placeInc, $setOnInsert: setOnInsert },
        { upsert: true },
      ),
    );
  }

  if (writes.length) {
    await Promise.all(writes);
  }

  return { ok: true };
}
