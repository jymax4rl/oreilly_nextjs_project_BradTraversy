import { Resend } from "resend";
import { BRAND_NAME, BRAND_SITE_URL } from "@/utils/brand";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom } from "@/utils/email/fromAddress";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendCleanerInviteEmail({ to, name, hostName, token }) {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) {
    console.warn("[cleaners] invite email skipped — Resend is not configured");
    return { ok: false, error: "resend_unconfigured" };
  }

  const joinUrl = `${BRAND_SITE_URL}/cleaners/join/${token}`;
  const safeName = escapeHtml(name || "there");
  const safeHost = escapeHtml(hostName || "An Isisel host");

  const html = `
    <div style="font-family:Georgia,serif;background:#f7f9f8;padding:28px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6ecea;padding:28px 32px;">
        <p style="margin:0 0 4px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#1b5c57;">${escapeHtml(BRAND_NAME)} Cleaners</p>
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0c1a1a;font-weight:500;">You're invited to clean with ${safeHost}</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c1a1a;">Hi ${safeName},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3d4f4d;">
          ${safeHost} invited you to join their trusted cleaners on Isisel. Create your cleaner profile, see assigned homes, and send photo or audio reports from your phone.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${joinUrl}" style="display:inline-block;background:#1b5c57;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:600;">Accept invitation</a>
        </p>
        <p style="margin:0;font-size:12px;color:#7a8b89;">If the button does not open, copy this link:<br>${escapeHtml(joinUrl)}</p>
      </div>
    </div>
  `;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [to],
    subject: `${hostName || "A host"} invited you to clean with Isisel`,
    html,
    text: `Hi ${name || "there"},\n\n${hostName || "A host"} invited you to join their trusted cleaners on Isisel.\n\nAccept here: ${joinUrl}\n`,
  });

  if (error) {
    console.error("[cleaners] invite email failed:", error);
    return { ok: false, error: error.message || String(error) };
  }
  return { ok: true };
}
