import { Schema, models, model } from "mongoose";

/**
 * Separate creator-pay ledger. Never reuse Booking.pricingSnapshot.platformFee.
 * Spec statuses: pending_stay → accrued → approved → payable → paid
 *              (+ on_hold, reversed)
 */
export const CREATOR_COMMISSION_STATUSES = Object.freeze([
  "pending_stay",
  "accrued",
  "on_hold",
  "approved",
  "payable",
  "paid",
  "reversed",
]);

const StatusEventSchema = new Schema(
  {
    status: { type: String, enum: CREATOR_COMMISSION_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: "system" },
    note: { type: String, maxlength: 400, default: "" },
  },
  { _id: false },
);

const CreatorCommissionSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    hostId: { type: String, required: true, index: true },
    creatorPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "CreatorPartner",
      required: true,
      index: true,
    },
    creatorPartnerName: { type: String, trim: true, maxlength: 120, default: "" },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    propertyName: { type: String, trim: true, maxlength: 200, default: "" },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 32,
      index: true,
    },
    creatorPromoCodeId: {
      type: Schema.Types.ObjectId,
      ref: "CreatorPromoCode",
    },
    /** Snapshot fraction at attribution time. */
    rate: { type: Number, required: true, min: 0, max: 0.5 },
    accommodationBase: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, uppercase: true, trim: true, default: "USD" },
    checkIn: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    checkOut: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    nights: { type: Number, min: 0 },
    guestName: { type: String, trim: true, maxlength: 120, default: "" },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      index: true,
    },
    status: {
      type: String,
      enum: CREATOR_COMMISSION_STATUSES,
      default: "pending_stay",
      index: true,
    },
    statusHistory: { type: [StatusEventSchema], default: [] },
    accruedAt: { type: Date },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    payoutReference: { type: String, trim: true, maxlength: 120, default: "" },
    holdReason: { type: String, trim: true, maxlength: 400, default: "" },
  },
  { timestamps: true, collection: "CreatorCommissions" },
);

CreatorCommissionSchema.index({ hostId: 1, status: 1, checkOut: -1 });
CreatorCommissionSchema.index({ creatorPartnerId: 1, status: 1, checkOut: -1 });
CreatorCommissionSchema.index({ status: 1, accruedAt: -1 });

const CreatorCommission =
  models.CreatorCommission ||
  model("CreatorCommission", CreatorCommissionSchema);

export default CreatorCommission;
