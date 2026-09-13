import { createHash, randomBytes } from "crypto";
import MobileAuthCode from "@/models/MobileAuthCode";
import { MOBILE_AUTH_CODE_TTL_SECONDS } from "@/utils/mobileAuth/constants";

export function hashAuthCode(plaintext) {
  return createHash("sha256").update(String(plaintext)).digest("hex");
}

function newOpaqueCode() {
  return randomBytes(32).toString("base64url");
}

/**
 * Issue a short-lived one-time code for deep-link handoff.
 * @param {string} userId
 * @param {{ state?: string|null }} [options]
 * @returns {Promise<string>} plaintext code (put in deep-link URL once)
 */
export async function issueAuthCode(userId, { state = null } = {}) {
  const plaintext = newOpaqueCode();
  const codeHash = hashAuthCode(plaintext);
  const expiresAt = new Date(
    Date.now() + MOBILE_AUTH_CODE_TTL_SECONDS * 1000
  );
  const safeState =
    typeof state === "string" && state.trim()
      ? state.trim().slice(0, 256)
      : null;

  await MobileAuthCode.create({
    userId,
    codeHash,
    expiresAt,
    state: safeState,
  });
  return plaintext;
}

/**
 * Consume a one-time auth code (single use). Returns userId + state or null.
 * @param {string} plaintext
 * @returns {Promise<{ userId: string, state: string|null }|null>}
 */
export async function consumeAuthCode(plaintext) {
  if (!plaintext || typeof plaintext !== "string") return null;
  const codeHash = hashAuthCode(plaintext.trim());
  const existing = await MobileAuthCode.findOne({ codeHash });
  if (!existing) return null;
  if (existing.consumedAt) return null;
  if (existing.expiresAt.getTime() <= Date.now()) return null;

  existing.consumedAt = new Date();
  await existing.save();

  return {
    userId: existing.userId.toString(),
    state: existing.state || null,
  };
}
