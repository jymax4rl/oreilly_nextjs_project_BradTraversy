import { Schema, models, model } from "mongoose";

/**
 * UTC calendar-day counters. `views` increment on navigation (not heartbeats).
 * `visitors` increment once per anonymous sid per UTC day and outlive the
 * 48h TrafficSession TTL used by the live map.
 */
const TrafficDaySchema = new Schema(
  {
    _id: { type: String },
    views: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
  },
  { versionKey: false },
);

if (models.TrafficDay) {
  delete models.TrafficDay;
}

export default model("TrafficDay", TrafficDaySchema);
