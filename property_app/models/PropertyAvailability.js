import mongoose from "mongoose";

const HostBlockSchema = new mongoose.Schema(
  {
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    note: {
      type: String,
      maxlength: 500,
    },
  },
  { _id: true },
);

const CustomDayRateSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    priceUsd: {
      type: Number,
      required: true,
      min: 0.01,
    },
    note: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: false },
);

const PropertyAvailabilitySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true,
      index: true,
    },
    /** Added: id of the user who owns the property (copied from Property.owner) */
    hostId: {
      type: String,
      index: true,
    },
    defaultAvailability: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    hostBlocks: {
      type: [HostBlockSchema],
      default: [],
    },
    customDayRates: {
      type: [CustomDayRateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "PropertyAvailabilities",
  },
);

const PropertyAvailability =
  mongoose.models.PropertyAvailability ||
  mongoose.model("PropertyAvailability", PropertyAvailabilitySchema);

export default PropertyAvailability;
