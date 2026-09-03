import { Schema, models, model } from "mongoose";
import { CONTACT_SOURCE, CONTACT_TOPIC_IDS } from "@/utils/contact/constants";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    topic: {
      type: String,
      enum: CONTACT_TOPIC_IDS,
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    source: {
      type: String,
      default: CONTACT_SOURCE,
      index: true,
    },
    emailSentAt: { type: Date, default: null },
    emailError: { type: String, default: "", maxlength: 400 },
    ipHash: { type: String, default: "", maxlength: 64, index: true },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ email: 1, createdAt: -1 });
ContactMessageSchema.index({ createdAt: -1 });

const ContactMessage =
  models.ContactMessage || model("ContactMessage", ContactMessageSchema);

export default ContactMessage;
