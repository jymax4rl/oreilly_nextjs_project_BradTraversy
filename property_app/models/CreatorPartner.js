import { Schema, models, model } from "mongoose";
import crypto from "crypto";

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
    /** Optional link back to ops CRM lead. */
    creatorLeadId: {
      type: Schema.Types.ObjectId,
      ref: "CreatorLead",
      default: null,
    },
    /**
     * Read-only creator dashboard share / join token (host shares the URL).
     * Regenerating invalidates the previous link.
     */
    portalToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    portalTokenRotatedAt: { type: Date },
    /**
     * Linked Isisel account after the creator signs in via the invite link.
     * One Google user can claim multiple host partnerships.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    claimedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "CreatorPartners" },
);

CreatorPartnerSchema.index({ hostId: 1, status: 1, createdAt: -1 });
CreatorPartnerSchema.index({ hostId: 1, name: 1 });
CreatorPartnerSchema.index({ email: 1, hostId: 1 });
CreatorPartnerSchema.index({ userId: 1, status: 1 });

CreatorPartnerSchema.methods.ensurePortalToken = function ensurePortalToken() {
  if (this.portalToken) return this.portalToken;
  this.portalToken = crypto.randomBytes(24).toString("base64url");
  this.portalTokenRotatedAt = new Date();
  return this.portalToken;
};

CreatorPartnerSchema.methods.rotatePortalToken = function rotatePortalToken() {
  this.portalToken = crypto.randomBytes(24).toString("base64url");
  this.portalTokenRotatedAt = new Date();
  return this.portalToken;
};

const CreatorPartner =
  models.CreatorPartner || model("CreatorPartner", CreatorPartnerSchema);

export default CreatorPartner;
