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

const EMAIL_DISPATCH_STATUS = ["sent", "failed", "skipped", "opted_out"];

const EmailStatusSchema = new mongoose.Schema(
  {
    /** Guest/host confirmation after paid booking (idempotent across webhook retries). */
    confirmedGuest: { type: String, enum: EMAIL_DISPATCH_STATUS },
    confirmedHost: { type: String, enum: EMAIL_DISPATCH_STATUS },
    modifiedGuest: { type: String, enum: EMAIL_DISPATCH_STATUS },
    modifiedHost: { type: String, enum: EMAIL_DISPATCH_STATUS },
    cancelledGuest: { type: String, enum: EMAIL_DISPATCH_STATUS },
    cancelledHost: { type: String, enum: EMAIL_DISPATCH_STATUS },
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
    /** Collected at booking time so hosts can call / WhatsApp for payment. */
    guestPhone: { type: String },
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
    /**
     * When false, the stay is hidden from calendars and does not block nights.
     * The booking is kept (not cancelled). Missing/true = listed.
     */
    listed: { type: Boolean, default: true, index: true },
    unlistedAt: { type: Date },
    unlistedBy: { type: String },
    /**
     * How payment is collected.
     * - manual: guest reserved without gateway; host arranges payment (status usually pending)
     * - gateway: paid via Flutterwave (or similar); status usually confirmed
     */
    paymentMode: {
      type: String,
      enum: ["manual", "gateway"],
      default: undefined,
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
    /** Set when confirmation emails have been dispatched (webhook/callback idempotency). */
    confirmationEmailsDispatchedAt: { type: Date },
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
