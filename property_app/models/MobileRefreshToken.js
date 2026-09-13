import { Schema, models, model } from "mongoose";

/**
 * Opaque refresh tokens for Expo / mobile Bearer auth.
 * Only the SHA-256 hash is stored; plaintext is returned once to the client.
 */
const MobileRefreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    /** Hash of the token that replaced this one on rotation (audit / reuse detect). */
    replacedByHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MobileRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MobileRefreshToken =
  models.MobileRefreshToken ||
  model("MobileRefreshToken", MobileRefreshTokenSchema);

export default MobileRefreshToken;
