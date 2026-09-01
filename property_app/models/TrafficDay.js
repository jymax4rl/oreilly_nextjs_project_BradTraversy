import { Schema, models, model } from "mongoose";

/** UTC calendar-day page-view counter (incremented on navigation, not heartbeats). */
const TrafficDaySchema = new Schema(
  {
    _id: { type: String },
    views: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export default models.TrafficDay || model("TrafficDay", TrafficDaySchema);
