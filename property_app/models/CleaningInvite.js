import { Schema, models, model } from "mongoose";

const CleaningInviteSchema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "cancelled"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

CleaningInviteSchema.index({ hostId: 1, email: 1, status: 1 });

const CleaningInvite =
  models.CleaningInvite || model("CleaningInvite", CleaningInviteSchema);
export default CleaningInvite;
