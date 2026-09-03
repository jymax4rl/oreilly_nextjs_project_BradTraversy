import { Schema, models, model } from "mongoose";
import {
  CREATOR_PLATFORMS,
  CREATOR_STAGE_IDS,
  CREATOR_SOURCE,
} from "@/utils/creators/constants";

const ActorSchema = new Schema(
  {
    id: { type: String, default: null },
    email: { type: String, default: null },
    name: { type: String, default: null },
  },
  { _id: false },
);

const StageEventSchema = new Schema(
  {
    stage: { type: String, enum: CREATOR_STAGE_IDS, required: true },
    at: { type: Date, default: Date.now },
    by: { type: ActorSchema, default: undefined },
  },
  { _id: false },
);

const CreatorLeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    platform: {
      type: String,
      enum: CREATOR_PLATFORMS,
      default: undefined,
    },
    profileUrl: { type: String, default: "", trim: true, maxlength: 500 },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    source: {
      type: String,
      default: CREATOR_SOURCE,
      index: true,
    },
    stage: {
      type: String,
      enum: CREATOR_STAGE_IDS,
      default: "new",
      index: true,
    },
    notes: { type: String, default: "", trim: true, maxlength: 8000 },
    stageHistory: { type: [StageEventSchema], default: [] },
    emailSentAt: { type: Date, default: null },
    emailError: { type: String, default: "", maxlength: 400 },
    ipHash: { type: String, default: "", maxlength: 64, index: true },
  },
  { timestamps: true },
);

CreatorLeadSchema.index({ email: 1, createdAt: -1 });
CreatorLeadSchema.index({ createdAt: -1 });
CreatorLeadSchema.index({ stage: 1, createdAt: -1 });

const CreatorLead =
  models.CreatorLead || model("CreatorLead", CreatorLeadSchema);

export default CreatorLead;
