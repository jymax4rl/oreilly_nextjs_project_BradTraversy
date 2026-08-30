/**
 * Resend key split:
 * - RESEND_BOOKING_API_KEY — "Sending access" only (production booking emails)
 * - RESEND_ADMIN_API_KEY — "Full access" (local: npm run setup:email-templates)
 * - RESEND_API_KEY — legacy fallback if the vars above are unset
 */

export function getBookingResendApiKey() {
  return (
    process.env.RESEND_BOOKING_API_KEY ||
    process.env.RESEND_API_KEY ||
    null
  );
}

export function getAdminResendApiKey() {
  return (
    process.env.RESEND_ADMIN_API_KEY ||
    process.env.RESEND_API_KEY ||
    null
  );
}
