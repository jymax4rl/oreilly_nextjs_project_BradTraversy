import { Schema, models, model } from "mongoose";
import { AddressSchema } from "./AddressSchema";
import { coerceStoredAddress } from "@/utils/address";

const HostApplicationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: { type: String, required: true },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true },
    /**
     * Optional Cloudinary (or CDN) URLs for government ID scans.
     * Ops profile modal shows these when present; upload may be added later.
     */
    idDocumentUrls: {
      type: [String],
      default: undefined,
    },
    address: { type: AddressSchema, required: true },
    bio: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

/**
 * Older applications stored address as a single street string.
 * Mongoose 9 no longer passes `next` into pre-hooks — calling it throws
 * `TypeError: next is not a function` (minified to "e is not a function").
 */
HostApplicationSchema.pre("validate", function () {
  const coerced = coerceStoredAddress(this.address);
  if (coerced) {
    this.set("address", coerced);
  }
});

const HostApplication =
  models.HostApplication || model("HostApplication", HostApplicationSchema);

export default HostApplication;
