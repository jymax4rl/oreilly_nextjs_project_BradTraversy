/**
 * Resend key split:
 * - RESEND_BOOKING_API_KEY — "Sending access" only (production booking emails)
 * - RESEND_ADMIN_API_KEY — "Full access" (local: npm run setup:email-templates)
 * - RESEND_API_KEY — legacy fallback if the vars above are unset
 *
 * Empty strings in .env.local must not mask a real fallback key.
 */
function firstKey(...candidates) {
  for (const value of candidates) {
    const trimmed = String(value || "").trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function getBookingResendApiKey() {
  return firstKey(
    process.env.RESEND_BOOKING_API_KEY,
    process.env.RESEND_API_KEY,
    process.env.RESEND_ADMIN_API_KEY,
  );
}

export function getAdminResendApiKey() {
  return firstKey(
    process.env.RESEND_ADMIN_API_KEY,
    process.env.RESEND_API_KEY,
    process.env.RESEND_BOOKING_API_KEY,
  );
}
