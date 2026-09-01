import mongoose from "mongoose";
import TrafficBucket from "@/models/TrafficBucket";
import TrafficDay from "@/models/TrafficDay";
import TrafficSession from "@/models/TrafficSession";
import {
  DAILY_VISITOR_TARGET,
  describeTrafficLoad,
} from "@/utils/metrics/trafficLoad";
import { utcDayKey } from "@/utils/metrics/recordTraffic";
import {
  BUCKET_MS,
  SERIES_POINTS,
  trafficBucketId,
} from "@/utils/metrics/trafficBuckets";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

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

/**
 * Snapshot for the ops console: unique visitors today, open tabs (5 min),
 * page views, a 24h 15-min series, last-7-day totals, and a Mongo ping.
 *
 * Missing 15-min buckets are filled with 0 so the curve never has gaps.
 * Bucket `_id` is an ISO timestamp, so `$gte` string compare matches time order.
 */
export async function getTrafficSnapshot() {
  const now = new Date();
  const dayKey = utcDayKey(now);
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);

  const windowStart = new Date(now.getTime() - SERIES_POINTS * BUCKET_MS);
  const dayKeys7 = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dayKeys7.push(utcDayKey(d));
  }

  const [activeNow, visitorsToday, dayDoc, mongoPing, buckets, weekDocs] =
    await Promise.all([
      TrafficSession.countDocuments({ lastSeen: { $gte: activeSince } }),
      TrafficSession.countDocuments({ dayKey }),
      TrafficDay.findById(dayKey).select("views").lean(),
      mongoPingMs(),
      TrafficBucket.find({
        _id: { $gte: trafficBucketId(windowStart) },
      })
        .select("views")
        .sort({ _id: 1 })
        .limit(SERIES_POINTS + 8)
        .lean(),
      TrafficDay.find({ _id: { $in: dayKeys7 } })
        .select("views")
        .lean(),
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

  const viewsByDay = new Map(
    weekDocs.map((d) => [d._id, Number(d.views) || 0]),
  );
  const days7 = dayKeys7.map((id) => ({
    t: id,
    views: viewsByDay.get(id) || 0,
  }));

  const viewsToday = Number(dayDoc?.views) || 0;
  const load = describeTrafficLoad({ activeNow, visitorsToday });

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
  };
}
