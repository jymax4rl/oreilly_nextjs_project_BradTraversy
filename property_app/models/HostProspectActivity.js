import { Schema, models, model } from "mongoose";
import { ACTIVITY_TYPE_IDS } from "@/utils/acquisition/constants";

const ActorSchema = new Schema(
  {
    id: { type: String, default: null },
    email: { type: String, default: null },
    name: { type: String, default: null },
  },
  { _id: false },
);

const HostProspectActivitySchema = new Schema(
  {
    prospect: {
      type: Schema.Types.ObjectId,
      ref: "HostProspect",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPE_IDS,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    actor: { type: ActorSchema, default: undefined },
  },
  { timestamps: true },
);

HostProspectActivitySchema.index({ prospect: 1, createdAt: -1 });
HostProspectActivitySchema.index({ type: 1, createdAt: -1 });

const HostProspectActivity =
  models.HostProspectActivity ||
  model("HostProspectActivity", HostProspectActivitySchema);

export default HostProspectActivity;
