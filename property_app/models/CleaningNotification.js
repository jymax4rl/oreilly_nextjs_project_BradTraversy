import { Schema, models, model } from "mongoose";

const CleaningNotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    jobId: { type: Schema.Types.ObjectId, ref: "CleaningJob", default: null },
    read: { type: Boolean, default: false, index: true },
    channelReady: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

CleaningNotificationSchema.index({ userId: 1, createdAt: -1 });

const CleaningNotification =
  models.CleaningNotification ||
  model("CleaningNotification", CleaningNotificationSchema);
export default CleaningNotification;
