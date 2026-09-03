import { Resend } from "resend";
import { BRAND_EMAIL, BRAND_NAME } from "@/utils/brand";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom } from "@/utils/email/fromAddress";
import { stripHeaderSafe } from "@/utils/creators/sanitize";

const TOPIC_LABELS = {
  stay: "Stay / booking",
  hosting: "Hosting",
  press: "Press",
  partnership: "Partnership",
  other: "Other",
};

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

export async function sendContactMessageEmail(doc) {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) {
    return { ok: false, error: "resend_unconfigured" };
  }

  const name = stripHeaderSafe(doc.name, 120);
  const topicLabel = TOPIC_LABELS[doc.topic] || doc.topic || "Other";
  const subject = stripHeaderSafe(`Contact — ${topicLabel} — ${name}`, 180);
  const submitted = doc.createdAt
    ? new Date(doc.createdAt).toISOString()
    : new Date().toISOString();

  const html = `
    <div style="font-family:Georgia,serif;background:#f7f9f8;padding:28px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6ecea;padding:28px 32px;">
        <p style="margin:0 0 4px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#1b5c57;">${escapeHtml(BRAND_NAME)}</p>
        <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0c1a1a;font-weight:500;">New contact message</h1>
        <table style="width:100%;border-collapse:collapse;">
          ${row("Name", name)}
          ${row("Email", doc.email)}
          ${row("Topic", topicLabel)}
          ${row("Message", doc.message)}
          ${row("Submitted", submitted)}
          ${row("Source", "Isisel /contact")}
        </table>
      </div>
    </div>
  `;

  const text = [
    "New contact message received.",
    "",
    `Name: ${name}`,
    `Email: ${doc.email}`,
    `Topic: ${topicLabel}`,
    `Message: ${doc.message || "—"}`,
    `Submitted: ${submitted}`,
    "Source: Isisel /contact",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [BRAND_EMAIL],
    replyTo: doc.email,
    subject,
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message || String(error) };
  }
  return { ok: true };
}
