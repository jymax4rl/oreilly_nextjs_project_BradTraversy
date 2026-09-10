import mongoose from "mongoose";

const PricingSnapshotSchema = new mongoose.Schema(
  {
    nightlyRate: { type: Number },
    accommodationBase: { type: Number },
    cleaningFee: { type: Number },
    platformFee: { type: Number },
    /** Historical commission actually applied at booking creation. */
    commissionRateApplied: { type: Number },
    commissionAmount: { type: Number },
    commissionWaived: { type: Boolean },
    commissionWaiverReason: { type: String },
    total: { type: Number },
    nights: { type: Number },
    currency: { type: String, default: "USD" },
    /** Guest promo discount (creator code) — never mixed into platformFee. */
    promoCode: { type: String },
    promoDiscountRate: { type: Number },
    promoDiscountAmount: { type: Number },
    accommodationBeforePromo: { type: Number },
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
    lastError: { type: String, maxlength: 500 },
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
     * - gateway: paid via Creem / Flutterwave (or similar); status usually confirmed
     */
    paymentMode: {
      type: String,
      enum: ["manual", "gateway"],
      default: undefined,
    },
    /**
     * ops_training: seed stays created from the Operations console for host drills.
     * Excluded from investor analytics. Hosts still see them as normal reservations.
     */
    source: {
      type: String,
      enum: ["ops_training"],
      default: undefined,
      index: true,
    },
    /** Provider payment id (string — works for Creem ids and Flutterwave numeric ids). */
    transactionId: {
      type: String,
      sparse: true,
      unique: true,
    },
    propertyName: { type: String },
    /** Last listing this stay was moved from (host property-to-property move). */
    previousPropertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    previousPropertyName: { type: String },
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
    /**
     * Frozen cancellation / modify policy at reservation create time.
     * Eligibility MUST read this snapshot — never the live host/property policy.
     */
    cancellationPolicySnapshot: {
      freeCancelUntilHoursBeforeCheckIn: { type: Number },
      modifyUntilHoursBeforeCheckIn: { type: Number },
      allowGuestCancel: { type: Boolean },
      allowGuestModify: { type: Boolean },
      maxModifications: { type: Number },
      timeZone: { type: String },
      source: {
        type: String,
        enum: ["property", "host_default", "platform_default"],
      },
      capturedAt: { type: Date },
    },
    emailStatus: { type: EmailStatusSchema, default: () => ({}) },
    /** Set when confirmation emails have been dispatched (webhook/callback idempotency). */
    confirmationEmailsDispatchedAt: { type: Date },

    /**
     * Creator partnership attribution (host-funded marketing).
     * Never reuse platformFee / commissionAmount for these amounts.
     */
    creatorPromoCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 32,
      index: true,
    },
    creatorPromoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorPromoCode",
      index: true,
    },
    creatorPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorPartner",
      index: true,
    },
    creatorPartnerName: { type: String, trim: true, maxlength: 120 },
    creatorCommissionRate: { type: Number, min: 0, max: 0.5 },
    creatorCommissionBase: { type: Number, min: 0 },
    creatorCommissionAmount: { type: Number, min: 0, default: 0 },
    creatorHostId: { type: String, index: true },
    creatorAttributionStatus: {
      type: String,
      enum: ["none", "attributed", "void"],
      default: "none",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "Bookings",
  },
);

BookingSchema.index({ propertyId: 1, status: 1, checkIn: 1 });
BookingSchema.index({ createdAt: 1, status: 1 });
BookingSchema.index({ creatorHostId: 1, creatorPartnerId: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

export default Booking;
