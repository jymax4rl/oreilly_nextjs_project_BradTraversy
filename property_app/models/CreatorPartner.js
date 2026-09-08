import { Schema, models, model } from "mongoose";

/**
 * Host-managed creator partner for the performance commission program.
 * Separate from CreatorLead (public funnel CRM).
 */
const CreatorPartnerSchema = new Schema(
  {
    hostId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },
    platform: {
      type: String,
      enum: ["instagram", "tiktok", "youtube", "multiple", "other", ""],
      default: "",
    },
    profileUrl: { type: String, trim: true, maxlength: 500, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["active", "paused", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, collection: "CreatorPartners" },
);

CreatorPartnerSchema.index({ hostId: 1, status: 1, createdAt: -1 });
CreatorPartnerSchema.index({ hostId: 1, name: 1 });

const CreatorPartner =
  models.CreatorPartner || model("CreatorPartner", CreatorPartnerSchema);

export default CreatorPartner;
