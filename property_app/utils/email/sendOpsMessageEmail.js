import { Resend } from "resend";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom, getEmailReplyTo } from "@/utils/email/fromAddress";
import { getAbsoluteAppUrl } from "@/utils/email/propertyImageUrl";
import { BRAND_NAME } from "@/utils/brand";

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

function bodyToHtml(raw) {
  return escapeHtml(raw).replace(/\r\n|\r|\n/g, "<br />");
}

function inboxPathFor(user) {
  return user?.hostStatus === "verified" ? "/host/messages" : "/messages";
}

/**
 * Email a marketplace user when ops sends them an in-app message.
 * Failures are logged and never thrown — the in-app message already exists.
 */
export async function sendOpsMessageEmail({
  recipientEmail,
  recipientName,
  hostStatus,
  body,
  propertyName,
}) {
  const to = String(recipientEmail || "").trim();
  if (!to) {
    return { sent: false, reason: "no_email" };
  }

  const resend = getResend();
  if (!resend) {
    console.warn("Ops message email skipped: Resend key not configured");
    return { sent: false, reason: "not_configured" };
  }

  const inboxUrl = getAbsoluteAppUrl(inboxPathFor({ hostStatus }));
  const name = escapeHtml(recipientName || "there");
  const listing = String(propertyName || "").trim();
  const listingHtml = listing
    ? `<p style="margin: 0 0 16px; font-size: 14px; color: #4b5c5c;">À propos de / About: <strong>${escapeHtml(listing)}</strong></p>`
    : "";

  const subject = listing
    ? `${BRAND_NAME} — message au sujet de ${listing}`
    : `${BRAND_NAME} — vous avez un message`;

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.55; color: #0c1a1a; max-width: 560px;">
      <p style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #1b5c57; margin: 0 0 12px;">
        ${BRAND_NAME}
      </p>
      <h1 style="font-size: 24px; font-weight: 500; letter-spacing: -0.03em; margin: 0 0 16px;">
        Message de l’équipe ${BRAND_NAME}
      </h1>
      <p>Bonjour ${name},</p>
      <p>L’équipe ${BRAND_NAME} vous a écrit :</p>
      ${listingHtml}
      <blockquote style="margin: 0 0 20px; padding: 14px 16px; border-left: 3px solid #1b5c57; background: #f4f7f6; font-family: system-ui, sans-serif; font-size: 15px; white-space: pre-wrap;">
        ${bodyToHtml(body)}
      </blockquote>
      <p style="margin: 24px 0;">
        <a href="${inboxUrl}" style="display: inline-block; background: #1b5c57; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;">
          Ouvrir Messages
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">English</p>
      <p style="font-size: 14px; color: #4b5c5c;">
        The ${BRAND_NAME} team sent you a message. Open Messages on the site to reply.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: [to],
      replyTo: getEmailReplyTo(),
      subject,
      html,
    });

    if (error) {
      console.error("sendOpsMessageEmail failed:", error.message || error);
      return { sent: false, reason: "send_failed" };
    }

    return { sent: true, id: data?.id || null };
  } catch (err) {
    console.error("sendOpsMessageEmail failed:", err?.message || err);
    return { sent: false, reason: "send_failed" };
  }
}
