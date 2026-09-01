import { Resend } from "resend";
import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getAbsoluteAppUrl } from "@/utils/email/propertyImageUrl";
import { listingPublicUrlFor } from "@/utils/listings/propertySlug";

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

/** Extra recipients (always unioned with DB admins): ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL / EMAIL_REPLY_TO. */
export function getAdminNotificationEmailsFromEnv() {
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

/** @deprecated Use getAdminNotificationEmailsFromEnv or resolveAdminRecipientEmails. */
export function getAdminNotificationEmails() {
  return getAdminNotificationEmailsFromEnv();
}

/**
 * Recipients = Mongo users with role "admin", unioned with
 * ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL / EMAIL_REPLY_TO (always, not only fallback).
 */
export async function resolveAdminRecipientEmails() {
  const unique = new Map();
  let dbAdminCount = 0;
  let dbConnected = false;

  try {
    const connected = await connectToDatabase();
    dbConnected = Boolean(connected);
    if (connected) {
      const admins = await User.find({
        role: { $in: ["admin", "superadmin"] },
        email: { $exists: true, $ne: "" },
      })
        .select("email")
        .lean();

      for (const doc of admins) {
        const email = String(doc?.email || "").trim();
        if (!email) continue;
        const key = email.toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, email);
          dbAdminCount += 1;
        }
      }
    }
  } catch (error) {
    console.error(
      "resolveAdminRecipientEmails: DB lookup failed:",
      error?.message || error,
    );
  }

  const envEmails = getAdminNotificationEmailsFromEnv();
  for (const email of envEmails) {
    const key = email.toLowerCase();
    if (!unique.has(key)) unique.set(key, email);
  }

  if (unique.size === 0) {
    console.warn("resolveAdminRecipientEmails: zero recipients", {
      dbConnected,
      dbAdminCount,
      envFallbackCount: envEmails.length,
    });
  } else {
    console.info("resolveAdminRecipientEmails:", {
      dbConnected,
      dbAdminCount,
      envFallbackCount: envEmails.length,
      recipientCount: unique.size,
    });
  }

  return Array.from(unique.values());
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
      {
        hasEmailFrom: Boolean(process.env.EMAIL_FROM),
        hasResendKey: Boolean(getBookingResendApiKey()),
        propertyId: propertyId || null,
      },
    );
    return { sent: false, reason: "not_configured" };
  }

  const admins = await resolveAdminRecipientEmails();
  if (admins.length === 0) {
    console.warn(
      "Listing moderation email skipped: no users with role admin and no ADMIN_EMAIL fallback",
      { propertyId: propertyId || null },
    );
    return { sent: false, reason: "no_admin_email" };
  }

  const resend = getResend();
  if (!resend) {
    console.warn("Listing moderation email skipped: Resend client unavailable", {
      propertyId: propertyId || null,
      recipientCount: admins.length,
    });
    return { sent: false, reason: "no_client" };
  }

  const reviewUrl = getAbsoluteAppUrl(`/ops/listings`);
  const listingUrl = propertyId
    ? await listingPublicUrlFor(propertyId)
    : getAbsoluteAppUrl("/ops/listings");
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

  const from = process.env.EMAIL_FROM;
  console.info("sendListingSubmittedAdminEmail: sending", {
    propertyId: propertyId || null,
    recipientCount: admins.length,
    fromDomain: String(from || "").includes("@")
      ? String(from).split("@").pop()?.replace(/>.*/, "")
      : "unknown",
  });

  const results = await Promise.allSettled(
    admins.map(async (to) => {
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });
      if (error) {
        throw new Error(error.message || String(error));
      }
      return data?.id || null;
    }),
  );

  let sentCount = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      sentCount += 1;
    } else {
      console.error(
        `sendListingSubmittedAdminEmail failed for recipient ${i + 1}/${admins.length}:`,
        result.reason?.message || result.reason,
      );
    }
  }

  if (sentCount === 0) {
    console.error("sendListingSubmittedAdminEmail: all sends failed", {
      propertyId: propertyId || null,
      attempted: admins.length,
    });
    return { sent: false, reason: "send_failed", attempted: admins.length };
  }

  console.info("sendListingSubmittedAdminEmail: done", {
    propertyId: propertyId || null,
    sentCount,
    attempted: admins.length,
  });

  return {
    sent: true,
    sentCount,
    attempted: admins.length,
  };
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
  const listingUrl = propertyId
    ? await listingPublicUrlFor(propertyId)
    : getAbsoluteAppUrl("/host/listings");
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
