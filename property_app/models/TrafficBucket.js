import { Schema, models, model } from "mongoose";

/** 15-minute page-view buckets for the ops curve. TTL drops rows after 48h. */
const TrafficBucketSchema = new Schema(
  {
    _id: { type: String },
    views: { type: Number, default: 0 },
    expireAt: { type: Date, required: true },
  },
  { versionKey: false },
);

TrafficBucketSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default models.TrafficBucket ||
  model("TrafficBucket", TrafficBucketSchema);
