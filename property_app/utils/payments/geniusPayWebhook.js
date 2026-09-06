import crypto from "crypto";

/**
 * Verify GeniusPay webhook HMAC-SHA256.
 * signature = HMAC-SHA256(timestamp + "." + raw_json_body, whsec_…)
 * Headers: X-Webhook-Signature, X-Webhook-Timestamp
 * @see https://geniuspay.ci/docs/api
 */
export function verifyGeniusPayWebhookSignature(
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
) {
  if (!secret || !signatureHeader || timestampHeader == null || rawBody == null) {
    return false;
  }

  const payload =
    typeof rawBody === "string" ? rawBody : String(rawBody);
  const signed = `${String(timestampHeader)}.${payload}`;

  const expected = crypto
    .createHmac("sha256", String(secret).trim())
    .update(signed)
    .digest("hex");

  const received = String(signatureHeader).trim();
  // Some dashboards prefix with sha256=
  const receivedHex = received.replace(/^sha256=/i, "");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(receivedHex, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/** Reject replayed webhooks older than maxAgeSeconds (default 5 min). */
export function isGeniusPayWebhookTimestampFresh(
  timestampHeader,
  maxAgeSeconds = 300,
) {
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= maxAgeSeconds;
}
