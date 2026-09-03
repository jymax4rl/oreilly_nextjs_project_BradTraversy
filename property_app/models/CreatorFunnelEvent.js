import { Schema, models, model } from "mongoose";
import { CREATOR_FUNNEL_EVENTS } from "@/utils/creators/constants";

const CreatorFunnelEventSchema = new Schema(
  {
    event: {
      type: String,
      enum: CREATOR_FUNNEL_EVENTS,
      required: true,
      index: true,
    },
    platform: { type: String, default: "", maxlength: 40 },
    source: { type: String, default: "", maxlength: 40 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

CreatorFunnelEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const CreatorFunnelEvent =
  models.CreatorFunnelEvent ||
  model("CreatorFunnelEvent", CreatorFunnelEventSchema);

export default CreatorFunnelEvent;
