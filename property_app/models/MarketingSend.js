import { Schema, models, model } from "mongoose";

const MarketingSendSchema = new Schema(
  {
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    templateId: {
      type: String,
      required: true,
      maxlength: 64,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    resendId: {
      type: String,
      default: null,
    },
    channel: {
      type: String,
      enum: ["resend", "gmail"],
      default: "resend",
    },
    error: {
      type: String,
      default: null,
      maxlength: 500,
    },
    attachment: {
      type: String,
      default: null,
    },
    locale: {
      type: String,
      enum: ["en", "fr"],
      default: "en",
    },
    isTest: {
      type: Boolean,
      default: false,
    },
    socialUrl: {
      type: String,
      default: null,
      maxlength: 300,
    },
    sentBy: {
      id: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  { timestamps: true },
);

MarketingSendSchema.index({ recipientEmail: 1, createdAt: -1 });
MarketingSendSchema.index({ recipientEmail: 1, templateId: 1, createdAt: -1 });
MarketingSendSchema.index({ createdAt: -1 });
MarketingSendSchema.index({ templateId: 1, createdAt: -1 });

const MarketingSend =
  models.MarketingSend || model("MarketingSend", MarketingSendSchema);

export default MarketingSend;
