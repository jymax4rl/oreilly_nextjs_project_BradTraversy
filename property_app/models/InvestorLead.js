import { Schema, models, model } from "mongoose";
import { INVESTOR_SOURCE, INVESTOR_STAGE_IDS } from "@/utils/investors/constants";

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
    stage: { type: String, enum: INVESTOR_STAGE_IDS, required: true },
    at: { type: Date, default: Date.now },
    by: { type: ActorSchema, default: undefined },
  },
  { _id: false },
);

const InvestorLeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    organization: { type: String, default: "", trim: true, maxlength: 160 },
    role: { type: String, default: "", trim: true, maxlength: 120 },
    firmUrl: { type: String, default: "", trim: true, maxlength: 500 },
    proposal: { type: String, required: true, trim: true, maxlength: 6000 },
    source: {
      type: String,
      default: INVESTOR_SOURCE,
      index: true,
    },
    stage: {
      type: String,
      enum: INVESTOR_STAGE_IDS,
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

InvestorLeadSchema.index({ email: 1, createdAt: -1 });
InvestorLeadSchema.index({ createdAt: -1 });
InvestorLeadSchema.index({ stage: 1, createdAt: -1 });

const InvestorLead =
  models.InvestorLead || model("InvestorLead", InvestorLeadSchema);

export default InvestorLead;
