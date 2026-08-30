import { Resend } from "resend";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getAbsoluteAppUrl } from "@/utils/email/propertyImageUrl";

let resendClient = null;
let resendClientKey = null;

function getResend() {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) return null;
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }
  return resendClient;
}

function isConfigured() {
  return Boolean(getBookingResendApiKey() && process.env.EMAIL_FROM);
}

/** Comma-separated ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL addresses. */
export function getAdminNotificationEmails() {
  const raw =
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_REPLY_TO ||
    "";
  return String(raw)
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Notify admins that a host submitted a listing for review.
 * Failures are logged and must not fail the listing create API.
 */
export async function sendListingSubmittedAdminEmail({
  propertyId,
  propertyName,
  hostName,
  hostEmail,
}) {
  if (!isConfigured()) {
    console.warn(
      "Listing moderation email skipped: EMAIL_FROM / Resend key not configured",
    );
    return { sent: false, reason: "not_configured" };
  }

  const admins = getAdminNotificationEmails();
  if (admins.length === 0) {
    console.warn(
      "Listing moderation email skipped: set ADMIN_EMAIL (or ADMIN_NOTIFICATION_EMAIL)",
    );
    return { sent: false, reason: "no_admin_email" };
  }

  const resend = getResend();
  if (!resend) return { sent: false, reason: "no_client" };

  const reviewUrl = getAbsoluteAppUrl(`/admin/listings`);
  const listingUrl = getAbsoluteAppUrl(`/properties/${propertyId}`);
  const subject = `New listing pending review: ${propertyName || "Untitled"}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">Listing awaiting approval</h2>
      <p><strong>${escapeHtml(propertyName || "Untitled")}</strong> was submitted by
        ${escapeHtml(hostName || "a host")}${hostEmail ? ` (${escapeHtml(hostEmail)})` : ""}.</p>
      <p>
        <a href="${reviewUrl}">Review in admin</a>
        &nbsp;·&nbsp;
        <a href="${listingUrl}">Open listing</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: admins,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendListingSubmittedAdminEmail:", error?.message || error);
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Notify the host when their listing is approved or rejected.
 */
export async function sendListingDecisionHostEmail({
  hostEmail,
  hostName,
  propertyName,
  propertyId,
  decision,
  rejectionReason,
}) {
  if (!isConfigured() || !hostEmail) {
    return { sent: false, reason: "not_configured" };
  }

  const resend = getResend();
  if (!resend) return { sent: false, reason: "no_client" };

  const approved = decision === "approved";
  const listingUrl = getAbsoluteAppUrl(
    propertyId ? `/properties/${propertyId}` : "/host/listings",
  );
  const myListingsUrl = getAbsoluteAppUrl("/host/listings");
  const subject = approved
    ? `Your listing was approved: ${propertyName || "Kama Properties"}`
    : `Your listing was not approved: ${propertyName || "Kama Properties"}`;

  const reasonBlock =
    !approved && rejectionReason
      ? `<p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>`
      : "";

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <p>Hi ${escapeHtml(hostName || "there")},</p>
      <p>Your listing <strong>${escapeHtml(propertyName || "Untitled")}</strong>
        was <strong>${approved ? "approved" : "rejected"}</strong>.</p>
      ${reasonBlock}
      <p>
        <a href="${approved ? listingUrl : myListingsUrl}">
          ${approved ? "View your listing" : "Go to My Listings"}
        </a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [hostEmail],
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendListingDecisionHostEmail:", error?.message || error);
    return { sent: false, reason: "send_failed" };
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
