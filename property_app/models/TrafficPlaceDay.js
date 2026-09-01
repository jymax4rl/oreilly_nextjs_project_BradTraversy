import { Schema, models, model } from "mongoose";

/**
 * Durable city-level totals for one UTC day. Live TrafficSession rows expire;
 * these aggregates do not, so ops can still see where visitors came from.
 * No IP or account id. `_id` is `YYYY-MM-DD|CC|city`.
 */
const TrafficPlaceDaySchema = new Schema(
  {
    _id: { type: String },
    dayKey: { type: String, required: true, index: true },
    country: { type: String, maxlength: 2, default: "ZZ" },
    city: { type: String, maxlength: 80, default: "" },
    visitors: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    lat: { type: Number },
    lng: { type: Number },
  },
  { versionKey: false },
);

if (models.TrafficPlaceDay) {
  delete models.TrafficPlaceDay;
}

export default model("TrafficPlaceDay", TrafficPlaceDaySchema);
