import { Schema, models, model } from "mongoose";

/**
 * Short-lived one-time codes for Expo deep-link OAuth (isisel://auth?code=...).
 * Only the SHA-256 hash is stored; plaintext is redirected once to the app.
 */
const MobileAuthCodeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    /** Optional client correlation / CSRF value echoed on deep-link + exchange. */
    state: {
      type: String,
      default: null,
      maxlength: 256,
    },
  },
  {
    timestamps: true,
  }
);

MobileAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MobileAuthCode =
  models.MobileAuthCode || model("MobileAuthCode", MobileAuthCodeSchema);

export default MobileAuthCode;
