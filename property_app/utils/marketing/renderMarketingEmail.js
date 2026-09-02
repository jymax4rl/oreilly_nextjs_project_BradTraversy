import { interpolate } from "@/utils/marketing/templates";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function paragraphHtml(text) {
  return `<p>${nl2br(text)}</p>`;
}

/**
 * Plain letter HTML — Gmail files logo banners, CTA buttons, and
 * hidden preheaders as Promotions even when From is a person.
 */
export function renderMarketingEmailHtml(template, { name }) {
  const displayName = String(name || "").trim() || "there";
  const subject = interpolate(template.subject, displayName);
  const preview = interpolate(template.previewText, displayName);
  const body = (template.body || [])
    .map((p) => paragraphHtml(interpolate(p, displayName)))
    .join("");
  const closing = paragraphHtml(interpolate(template.closing, displayName));
  const html = `${body}${closing}`;

  return { html, subject, preview };
}

export function renderMarketingEmailText(template, { name }) {
  const displayName = String(name || "").trim() || "there";
  const paragraphs = (template.body || []).map((p) =>
    interpolate(p, displayName),
  );
  const closing = interpolate(template.closing, displayName);

  return [...paragraphs, closing]
    .filter((block) => String(block || "").trim())
    .join("\n\n");
}
