import { Schema } from "mongoose";

/** Structured postal address (Google Places + manual fields). */
export const AddressSchema = new Schema(
  {
    formatted: { type: String, trim: true },
    streetLine1: { type: String, trim: true, required: true },
    streetLine2: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, required: true },
    countryCode: { type: String, trim: true, uppercase: true },
    placeId: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false },
);
