import mongoose from "mongoose";

const PricingSnapshotSchema = new mongoose.Schema(
  {
    nightlyRate: { type: Number },
    accommodationBase: { type: Number },
    cleaningFee: { type: Number },
    platformFee: { type: Number },
    total: { type: Number },
    nights: { type: Number },
    currency: { type: String, default: "USD" },
  },
  { _id: false },
);

const EmailStatusSchema = new mongoose.Schema(
  {
    modifiedGuest: { type: String, enum: ["sent", "failed", "skipped"] },
    modifiedHost: { type: String, enum: ["sent", "failed", "skipped"] },
    cancelledGuest: { type: String, enum: ["sent", "failed", "skipped"] },
    cancelledHost: { type: String, enum: ["sent", "failed", "skipped"] },
  },
  { _id: false },
);

const BookingSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    guestId: {
      type: String,
      required: true,
      index: true,
    },
    guestName: { type: String },
    guestEmail: { type: String },
    checkIn: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    checkOut: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: Number,
      sparse: true,
      unique: true,
    },
    propertyName: { type: String },
    amount: { type: Number },
    currency: { type: String },
    version: { type: Number, default: 0 },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancellationReason: { type: String, maxlength: 500 },
    modifiedAt: { type: Date },
    previousCheckIn: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    previousCheckOut: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    modificationCount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "completed", "failed"],
      default: "none",
    },
    refundAmount: { type: Number },
    refundCurrency: { type: String },
    refundReference: { type: String },
    pricingSnapshot: { type: PricingSnapshotSchema },
    emailStatus: { type: EmailStatusSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "Bookings",
  },
);

BookingSchema.index({ propertyId: 1, status: 1, checkIn: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

export default Booking;
