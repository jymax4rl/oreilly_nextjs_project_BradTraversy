import { Resend } from "resend";
import { BRAND_NAME, MARKETING_FROM_EMAIL } from "@/utils/brand";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom } from "@/utils/email/fromAddress";
import { stripHeaderSafe } from "@/utils/creators/sanitize";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  const text = value || "—";
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e6ecea;color:#5a6b69;font-size:13px;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e6ecea;color:#0c1a1a;font-size:15px;white-space:pre-wrap;">${escapeHtml(text)}</td>
    </tr>
  `;
}

/**
 * Horizon ownership leads go to jimmeh@isisel.com.
 */
export async function sendHorizonLeadEmail(lead) {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) {
    return { ok: false, error: "resend_unconfigured" };
  }

  const name = stripHeaderSafe(lead.name, 120);
  const intentLabel =
    lead.intent === "message" ? "Contact / email reply" : "Request a call";
  const subject = stripHeaderSafe(
    `Horizon lead — ${intentLabel} — ${name}`,
    180,
  );
  const submitted = new Date().toISOString();

  const html = `
    <div style="font-family:Georgia,serif;background:#f7f9f8;padding:28px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6ecea;padding:28px 32px;">
        <p style="margin:0 0 4px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#1b5c57;">${escapeHtml(BRAND_NAME)} · Horizon</p>
        <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0c1a1a;font-weight:500;">New Horizon ownership lead</h1>
        <table style="width:100%;border-collapse:collapse;">
          ${row("Intent", intentLabel)}
          ${row("Name", name)}
          ${row("Email", lead.email)}
          ${row("Phone", lead.phone)}
          ${row("Subject", lead.subject)}
          ${row("ZIP", lead.zip)}
          ${row("Message", lead.message)}
          ${row("Submitted", submitted)}
          ${row("Source", "Isisel /horizon")}
          ${row("Project", "Horizon · Swami India · Bijilo · 2 bed · $130,000")}
        </table>
      </div>
    </div>
  `;

  const text = [
    "New Horizon ownership lead.",
    "",
    `Intent: ${intentLabel}`,
    `Name: ${name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "—"}`,
    `Subject: ${lead.subject || "—"}`,
    `ZIP: ${lead.zip || "—"}`,
    `Message: ${lead.message || "—"}`,
    `Submitted: ${submitted}`,
    "Source: Isisel /horizon",
    "Project: Horizon · Swami India · Bijilo · 2 bed · $130,000",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [MARKETING_FROM_EMAIL],
    replyTo: lead.email,
    subject,
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message || String(error) };
  }
  return { ok: true };
}
