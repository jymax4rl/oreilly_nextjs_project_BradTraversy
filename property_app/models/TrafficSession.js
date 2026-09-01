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
  },
  { versionKey: false },
);

TrafficSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default models.TrafficSession ||
  model("TrafficSession", TrafficSessionSchema);
