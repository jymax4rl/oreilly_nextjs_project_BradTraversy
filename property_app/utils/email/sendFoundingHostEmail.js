import { Resend } from "resend";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom, getEmailReplyTo } from "@/utils/email/fromAddress";
import { getAbsoluteAppUrl } from "@/utils/email/propertyImageUrl";
import { BRAND_NAME } from "@/utils/brand";
import { PROGRAM_DEFAULTS } from "@/utils/foundingHost/logic";

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLongDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatPercent(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 1000) / 10}%`.replace(/\.0%$/, "%");
}

/**
 * Congratulatory email when a host is assigned a Founding Host number.
 * Uses the existing Resend booking key / from-address.
 */
export async function sendFoundingHostWelcomeEmail({
  hostEmail,
  hostName,
  number,
  expiresAt,
  commissionRate = PROGRAM_DEFAULTS.foundingHostCommissionRate,
}) {
  const to = String(hostEmail || "").trim();
  if (!to) {
    return { sent: false, reason: "no_email" };
  }

  const resend = getResend();
  if (!resend) {
    console.warn("Founding Host welcome email skipped: Resend key not configured");
    return { sent: false, reason: "not_configured" };
  }

  const dashboardUrl = getAbsoluteAppUrl("/host");
  const learnMoreUrl = getAbsoluteAppUrl("/founding-hosts");
  const name = escapeHtml(hostName || "Host");
  const expiresLabel = escapeHtml(formatLongDate(expiresAt));
  const rateLabel = escapeHtml(formatPercent(commissionRate));

  const subject = `Welcome to the ${BRAND_NAME} Founding 100 🎉`;
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.55; color: #0c1a1a; max-width: 560px;">
      <p style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #1b5c57; margin: 0 0 12px;">
        Founding Host #${escapeHtml(number)}
      </p>
      <h1 style="font-size: 28px; font-weight: 500; letter-spacing: -0.03em; margin: 0 0 16px;">
        Welcome to the ${BRAND_NAME} Founding 100
      </h1>
      <p>Dear ${name},</p>
      <p>
        You are officially one of ${BRAND_NAME}’s Founding 100 Hosts.
        That recognition is yours — Founding Host #${escapeHtml(number)}.
      </p>
      <p>
        While your Founding Host benefit is active, Isisel commission on your bookings is
        <strong>${rateLabel}</strong>.
      </p>
      <p>
        Commission-free until <strong>${expiresLabel}</strong>.
        After that date, standard Isisel commission applies to new bookings.
        Your Founding Host badge remains.
      </p>
      <p style="margin: 24px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #1b5c57; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;">
          Open host console
        </a>
      </p>
      <p style="font-size: 14px; color: #4b5c5c;">
        <a href="${learnMoreUrl}" style="color: #1b5c57;">Learn more about the Founding 100</a>
      </p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [to],
    replyTo: getEmailReplyTo(),
    subject,
    html,
  });

  if (error) {
    console.error("sendFoundingHostWelcomeEmail failed:", error.message || error);
    return { sent: false, reason: "send_failed" };
  }

  return { sent: true, id: data?.id || null };
}
