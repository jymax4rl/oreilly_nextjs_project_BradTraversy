import crypto from "crypto";

/**
 * Verify Creem webhook HMAC-SHA256 (`creem-signature` header).
 * @see https://docs.creem.io/code/webhooks
 */
export function verifyCreemWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader || rawBody == null) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? rawBody : String(rawBody))
    .digest("hex");

  const received = String(signatureHeader).trim();
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(received, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
