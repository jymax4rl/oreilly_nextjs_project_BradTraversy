import { Schema, models, model } from "mongoose";

const HostCleanerLinkSchema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cleanerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
      index: true,
    },
    assignedPropertyIds: {
      type: [Schema.Types.ObjectId],
      ref: "Property",
      default: [],
    },
    lastJobAt: { type: Date, default: null },
    completedCleanings: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

HostCleanerLinkSchema.index({ hostId: 1, cleanerId: 1 }, { unique: true });

const HostCleanerLink =
  models.HostCleanerLink || model("HostCleanerLink", HostCleanerLinkSchema);
export default HostCleanerLink;
