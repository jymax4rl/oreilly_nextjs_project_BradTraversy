import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    owner: { type: String, required: false },
    is_featured: { type: Boolean, required: true, default: false },
    type: { type: String, required: true },
    description: { type: String },
    location: {
      street: { type: String },
      streetLine2: { type: String },
      city: { type: String },
      state: { type: String },
      zipcode: { type: String },
      country: { type: String },
      formatted: { type: String },
      placeId: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      showExactLocation: { type: Boolean, default: false },
    },
    listing: {
      privacyType: {
        type: String,
        enum: ["entire_place", "private_room", "shared_room", ""],
        default: "entire_place",
      },
      maxGuests: { type: Number, default: 2 },
      bedroomHasLock: { type: Boolean, default: false },
    },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    square_feet: { type: Number, required: true },
    amenities: [{ type: String }],
    rates: {
      nightly: { type: Number },
      weekly: { type: Number },
      monthly: { type: Number },
      weekendPremium: { type: Number, default: 0 },
    },
    /** USD nightly equivalent — indexed for search filters */
    listingPrice: { type: Number, index: true },
    seller_info: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    /**
     * Optional cancellation / modify windows. Missing fields fall back to
     * DEFAULT_BOOKING_POLICY in utils/bookings/bookingPolicy.js.
     */
    bookingPolicy: {
      freeCancelUntilHoursBeforeCheckIn: { type: Number },
      modifyUntilHoursBeforeCheckIn: { type: Number },
      allowGuestCancel: { type: Boolean },
      allowGuestModify: { type: Boolean },
      maxModifications: { type: Number },
    },
    images: [{ type: Schema.Types.Mixed }],
    audio: { type: Schema.Types.Mixed, required: false },
    /**
     * Listing moderation. New submissions start as "pending".
     * Legacy docs without status remain publicly visible (see listingApproval helpers).
     */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: false,
    },
    /** Set when a host submits a listing for review (distinguishes new pending from legacy). */
    listingModerationRequestedAt: { type: Date, required: false },
    rejectionReason: { type: String, required: false },
    listingReviewedAt: { type: Date, required: false },
    listingReviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  {
    timestamps: true,
    strict: false,
    collection: "Properties",
  },
);

const Property =
  mongoose.models.Property || mongoose.model("Property", PropertySchema);

export default Property;
