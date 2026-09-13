import { Schema, models, model } from "mongoose";

/**
 * Host-assigned promo code for one property + one creator partner.
 * Guest discount updates checkout price; creator commission is separate.
 */
const CreatorPromoCodeSchema = new Schema(
  {
    hostId: { type: String, required: true, index: true },
    creatorPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "CreatorPartner",
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 32,
    },
    /** Fraction of accommodation base paid to the creator, e.g. 0.1 = 10%. */
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 0.5,
    },
    /**
     * Fraction off accommodation for the guest at checkout, e.g. 0.1 = 10% off.
     * Independent of creator commissionRate.
     */
    guestDiscountRate: {
      type: Number,
      min: 0,
      max: 0.5,
      default: 0.1,
    },
    status: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
      index: true,
    },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true, collection: "CreatorPromoCodes" },
);

CreatorPromoCodeSchema.index({ code: 1 }, { unique: true });
CreatorPromoCodeSchema.index({ hostId: 1, propertyId: 1, status: 1 });
CreatorPromoCodeSchema.index({ creatorPartnerId: 1, status: 1 });

const CreatorPromoCode =
  models.CreatorPromoCode || model("CreatorPromoCode", CreatorPromoCodeSchema);

export default CreatorPromoCode;
