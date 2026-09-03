import { interpolate } from "@/utils/marketing/templates";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/utils/brand";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(escaped) {
  return escaped
    .replace(
      /www\.isisel\.com/g,
      '<a href="https://www.isisel.com" style="color:#1b5c57;text-decoration:underline;">www.isisel.com</a>',
    )
    .replace(
      new RegExp(
        `WhatsApp\\s+${WHATSAPP_DISPLAY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "g",
      ),
      `<a href="${WHATSAPP_URL}" style="color:#1b5c57;text-decoration:underline;">WhatsApp ${WHATSAPP_DISPLAY}</a>`,
    );
}

function nl2br(text) {
  return linkify(escapeHtml(text)).replace(/\n/g, "<br />");
}

function paragraphHtml(text, isLast) {
  const margin = isLast ? "0" : "0 0 20px";
  return `<p style="margin:${margin};line-height:1.75;font-size:16px;color:#1a1a1a;">${nl2br(text)}</p>`;
}

function splitLetter(body) {
  return String(body || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/**
 * Quiet branded letter — serif-adjacent spacing, teal links, no banner.
 */
export function renderMarketingEmailHtml({ subject, body, previewText = "" }) {
  const paragraphs = splitLetter(body);
  const inner = paragraphs
    .map((block, index) => paragraphHtml(block, index === paragraphs.length - 1))
    .join("");
  const preheader = escapeHtml(String(previewText || "").trim());
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject || "Isisel")}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e0d4;">
          <tr>
            <td style="padding:28px 36px 8px;border-bottom:2px solid #1b5c57;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.18em;text-transform:uppercase;color:#1b5c57;">Isisel</p>
              <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:12px;color:#6b6358;">African vacation rentals · www.isisel.com</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 12px;font-family:Georgia,'Times New Roman',serif;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 32px;font-family:Georgia,'Times New Roman',serif;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6358;">
                <a href="${WHATSAPP_URL}" style="color:#1b5c57;text-decoration:none;font-weight:600;">WhatsApp ${WHATSAPP_DISPLAY}</a>
                &nbsp;·&nbsp;
                <a href="https://www.isisel.com" style="color:#6b6358;text-decoration:none;">www.isisel.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return {
    html,
    subject: String(subject || "").trim(),
    preview: String(previewText || "").trim(),
  };
}

export function renderMarketingEmailText({ body }) {
  return splitLetter(body).join("\n\n");
}

/** Keep interpolate available for callers that still pass template fields. */
export { interpolate };
