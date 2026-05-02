import { Schema, models, model } from "mongoose";

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
    address: { type: String, required: true },
    bio: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const HostApplication =
  models.HostApplication || model("HostApplication", HostApplicationSchema);

export default HostApplication;
