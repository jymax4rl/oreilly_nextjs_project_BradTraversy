import { Schema, models, model } from "mongoose";

/**
 * Anonymous browser session for ops traffic (no IP, no user id).
 * TTL drops idle rows so the collection cannot grow without bound.
 */
const TrafficSessionSchema = new Schema(
  {
    _id: { type: String },
    dayKey: { type: String, required: true, index: true },
    lastSeen: { type: Date, required: true, index: true },
    expireAt: { type: Date, required: true },
    lat: { type: Number },
    lng: { type: Number },
    country: { type: String, maxlength: 2 },
    city: { type: String, maxlength: 80 },
    geoSource: { type: String, enum: ["vercel", "tz"] },
    /** UTC day this sid was last counted toward TrafficPlaceDay visitors. */
    geoDayKey: { type: String },
  },
  { versionKey: false },
);

TrafficSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

if (models.TrafficSession) {
  delete models.TrafficSession;
}

export default model("TrafficSession", TrafficSessionSchema);
