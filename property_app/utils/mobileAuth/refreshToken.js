import { createHash, randomBytes } from "crypto";
import MobileRefreshToken from "@/models/MobileRefreshToken";
import { REFRESH_TOKEN_DAYS } from "@/utils/mobileAuth/constants";

export function hashRefreshToken(plaintext) {
  return createHash("sha256").update(String(plaintext)).digest("hex");
}

function newOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

function expiresAtFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_DAYS);
  return d;
}

/**
 * Create and persist a new opaque refresh token for the user.
 * @param {string} userId
 * @returns {Promise<string>} plaintext refresh token (return once to client)
 */
export async function issueRefreshToken(userId) {
  const plaintext = newOpaqueToken();
  const tokenHash = hashRefreshToken(plaintext);
  await MobileRefreshToken.create({
    userId,
    tokenHash,
    expiresAt: expiresAtFromNow(),
  });
  return plaintext;
}

/**
 * Validate a refresh token, revoke it, and issue a rotated replacement.
 * @param {string} plaintext
 * @returns {Promise<{ userId: string, refreshToken: string }|null>}
 */
export async function rotateRefreshToken(plaintext) {
  if (!plaintext || typeof plaintext !== "string") return null;
  const tokenHash = hashRefreshToken(plaintext.trim());
  const existing = await MobileRefreshToken.findOne({ tokenHash });
  if (!existing) return null;
  if (existing.revokedAt) return null;
  if (existing.expiresAt.getTime() <= Date.now()) return null;

  const nextPlaintext = newOpaqueToken();
  const nextHash = hashRefreshToken(nextPlaintext);

  existing.revokedAt = new Date();
  existing.replacedByHash = nextHash;
  await existing.save();

  await MobileRefreshToken.create({
    userId: existing.userId,
    tokenHash: nextHash,
    expiresAt: expiresAtFromNow(),
  });

  return {
    userId: existing.userId.toString(),
    refreshToken: nextPlaintext,
  };
}

/**
 * Revoke a refresh token if it belongs to the given user.
 * @param {string} plaintext
 * @param {string} userId
 * @returns {Promise<boolean>} true if a matching token was found (already revoked counts as success)
 */
export async function revokeRefreshToken(plaintext, userId) {
  if (!plaintext || typeof plaintext !== "string" || !userId) return false;
  const tokenHash = hashRefreshToken(plaintext.trim());
  const existing = await MobileRefreshToken.findOne({
    tokenHash,
    userId,
  });
  if (!existing) return false;
  if (!existing.revokedAt) {
    existing.revokedAt = new Date();
    await existing.save();
  }
  return true;
}
