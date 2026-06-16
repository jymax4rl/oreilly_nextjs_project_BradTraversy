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
    images: [{ type: String }],
    audio: { type: String, required: false },
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
