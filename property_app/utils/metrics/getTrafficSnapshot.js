import mongoose from "mongoose";
import TrafficBucket from "@/models/TrafficBucket";
import TrafficDay from "@/models/TrafficDay";
import TrafficPlaceDay from "@/models/TrafficPlaceDay";
import TrafficSession from "@/models/TrafficSession";
import {
  DAILY_VISITOR_TARGET,
  describeTrafficLoad,
} from "@/utils/metrics/trafficLoad";
import { utcDayKey, utcDayKeys } from "@/utils/metrics/recordTraffic";
import {
  BUCKET_MS,
  SERIES_POINTS,
  trafficBucketId,
} from "@/utils/metrics/trafficBuckets";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const LIVE_DOT_LIMIT = 200;
const HISTORY_DAYS = 30;
const PLACE_TABLE_LIMIT = 40;
const HISTORY_DOT_LIMIT = 80;

async function mongoPingMs() {
  const db = mongoose.connection?.db;
  if (!db) return null;
  const started = Date.now();
  try {
    await db.admin().command({ ping: 1 });
    return Date.now() - started;
  } catch {
    return null;
  }
}

function sumField(docs, field) {
  return docs.reduce((acc, d) => acc + (Number(d[field]) || 0), 0);
}

function placeKey(row) {
  const country = String(row.country || "ZZ").toUpperCase();
  const city = String(row.city || "")
    .trim()
    .toLowerCase();
  return `${country}|${city}`;
}

function rollupPlaceDays(docs) {
  const map = new Map();
  for (const row of docs) {
    const country = String(row.country || "ZZ").toUpperCase();
    const city = String(row.city || "").trim();
    const key = placeKey({ country, city });
    const prev = map.get(key) || {
      country,
      city,
      visitors: 0,
      views: 0,
      lat: null,
      lng: null,
    };
    prev.visitors += Number(row.visitors) || 0;
    prev.views += Number(row.views) || 0;
    if (
      prev.lat == null &&
      Number.isFinite(row.lat) &&
      Number.isFinite(row.lng)
    ) {
      prev.lat = row.lat;
      prev.lng = row.lng;
    }
    map.set(key, prev);
  }
  return map;
}

/**
 * Live sessions still in Mongo (up to 48h) fill gaps from before place-day
 * aggregates existed. Take the larger visitor count so we do not double-add
 * the same browsers after both stores overlap.
 */
function mergePlaces(durableMap, sessionRows) {
  const map = new Map(durableMap);
  for (const row of sessionRows) {
    const country = String(row._id?.country || "ZZ").toUpperCase();
    const city = String(row._id?.city || "").trim();
    const key = placeKey({ country, city });
    const visitors = Number(row.visitors) || 0;
    const lat = Number.isFinite(row.lat) ? row.lat : null;
    const lng = Number.isFinite(row.lng) ? row.lng : null;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        country,
        city,
        visitors,
        views: 0,
        lat,
        lng,
      });
      continue;
    }
    prev.visitors = Math.max(prev.visitors, visitors);
    if (prev.lat == null && lat != null) {
      prev.lat = lat;
      prev.lng = lng;
    }
  }
  return [...map.values()].sort(
    (a, b) => b.visitors - a.visitors || b.views - a.views,
  );
}

/**
 * Snapshot for the ops console: unique visitors today, open tabs (5 min),
 * page views, a 24h 15-min series, last-7-day totals, live map dots,
 * durable 7/30-day visitor + place history, and a Mongo ping.
 *
 * Missing 15-min buckets are filled with 0 so the curve never has gaps.
 * Bucket `_id` is an ISO timestamp, so `$gte` string compare matches time order.
 */
export async function getTrafficSnapshot() {
  const now = new Date();
  const dayKey = utcDayKey(now);
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);

  const windowStart = new Date(now.getTime() - SERIES_POINTS * BUCKET_MS);
  const dayKeys30 = utcDayKeys(HISTORY_DAYS, now);
  const dayKeys7 = dayKeys30.slice(-7);

  const [
    activeNow,
    sessionVisitorsToday,
    dayDoc,
    mongoPing,
    buckets,
    monthDocs,
    liveDocs,
    placeDayDocs,
    sessionPlaceRows,
  ] = await Promise.all([
    TrafficSession.countDocuments({ lastSeen: { $gte: activeSince } }),
    TrafficSession.countDocuments({ dayKey }),
    TrafficDay.findById(dayKey).select("views visitors").lean(),
    mongoPingMs(),
    TrafficBucket.find({
      _id: { $gte: trafficBucketId(windowStart) },
    })
      .select("views")
      .sort({ _id: 1 })
      .limit(SERIES_POINTS + 8)
      .lean(),
    TrafficDay.find({ _id: { $in: dayKeys30 } })
      .select("views visitors")
      .lean(),
    TrafficSession.find({
      lastSeen: { $gte: activeSince },
      lat: { $type: "number" },
      lng: { $type: "number" },
    })
      .select("lat lng country city geoSource")
      .limit(LIVE_DOT_LIMIT)
      .lean(),
    TrafficPlaceDay.find({ dayKey: { $gte: dayKeys30[0] } })
      .select("country city visitors views lat lng")
      .lean(),
    TrafficSession.aggregate([
      {
        $match: {
          $or: [
            { country: { $exists: true, $nin: [null, ""] } },
            { city: { $exists: true, $nin: [null, ""] } },
          ],
        },
      },
      {
        $group: {
          _id: {
            country: { $ifNull: ["$country", "ZZ"] },
            city: { $ifNull: ["$city", ""] },
          },
          visitors: { $sum: 1 },
          lat: { $avg: "$lat" },
          lng: { $avg: "$lng" },
        },
      },
    ]),
  ]);

  const viewsByBucket = new Map(
    buckets.map((b) => [b._id, Number(b.views) || 0]),
  );
  const series = [];
  for (let i = SERIES_POINTS - 1; i >= 0; i -= 1) {
    const t = new Date(now.getTime() - i * BUCKET_MS);
    const id = trafficBucketId(t);
    series.push({ t: id, views: viewsByBucket.get(id) || 0 });
  }

  const byDay = new Map(
    monthDocs.map((d) => [
      d._id,
      {
        views: Number(d.views) || 0,
        visitors: Number(d.visitors) || 0,
      },
    ]),
  );
  const days30 = dayKeys30.map((id) => ({
    t: id,
    views: byDay.get(id)?.views || 0,
    visitors: byDay.get(id)?.visitors || 0,
  }));
  const days7 = days30.slice(-7);

  const viewsToday = Number(dayDoc?.views) || 0;
  // Mid-deploy, TrafficDay.visitors may lag the still-live session count.
  const visitorsToday = Math.max(
    Number(dayDoc?.visitors) || 0,
    sessionVisitorsToday,
  );
  const load = describeTrafficLoad({ activeNow, visitorsToday });

  const places = mergePlaces(rollupPlaceDays(placeDayDocs), sessionPlaceRows);
  const tablePlaces = places.slice(0, PLACE_TABLE_LIMIT);
  const historyDots = places
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, HISTORY_DOT_LIMIT)
    .map((p) => ({
      lat: p.lat,
      lng: p.lng,
      country: p.country,
      city: p.city,
      visitors: p.visitors,
    }));

  const weekDocs = days7;
  const visitors7 = sumField(weekDocs, "visitors");
  const views7 = sumField(weekDocs, "views");
  const visitors30 = sumField(days30, "visitors");
  const views30 = sumField(days30, "views");

  return {
    activeNow,
    visitorsToday,
    viewsToday,
    dailyTarget: DAILY_VISITOR_TARGET,
    ofTargetPct: Math.min(
      100,
      Math.round((visitorsToday / DAILY_VISITOR_TARGET) * 1000) / 10,
    ),
    mongoPingMs: mongoPing,
    mongoReadyState: mongoose.connection?.readyState ?? 0,
    load,
    windowSeconds: ACTIVE_WINDOW_MS / 1000,
    dayKey,
    series,
    days7,
    history: {
      visitors7,
      views7,
      visitors30,
      views30,
      places: tablePlaces,
      placeCount: places.length,
    },
    live: (liveDocs || []).map((row) => ({
      lat: row.lat,
      lng: row.lng,
      country: row.country || "",
      city: row.city || "",
      source: row.geoSource || "",
    })),
    historyDots,
  };
}
