import mongoose from "mongoose";
import TrafficDay from "@/models/TrafficDay";
import TrafficSession from "@/models/TrafficSession";
import {
  DAILY_VISITOR_TARGET,
  describeTrafficLoad,
} from "@/utils/metrics/trafficLoad";
import { utcDayKey } from "@/utils/metrics/recordTraffic";

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
 * page views, and a Mongo ping that flags connection pressure.
 */
export async function getTrafficSnapshot() {
  const now = new Date();
  const dayKey = utcDayKey(now);
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);

  const [activeNow, visitorsToday, dayDoc, mongoPing] = await Promise.all([
    TrafficSession.countDocuments({ lastSeen: { $gte: activeSince } }),
    TrafficSession.countDocuments({ dayKey }),
    TrafficDay.findById(dayKey).select("views").lean(),
    mongoPingMs(),
  ]);

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
  };
}
