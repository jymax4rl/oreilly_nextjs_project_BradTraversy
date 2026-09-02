import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getMarketingEmailFrom, getMarketingReplyTo } from "@/utils/email/fromAddress";
import { DEFAULT_PRODUCTION_APP_URL } from "@/utils/appUrl";
import {
  MARKETING_PDFS,
  composeMarketingLetter,
  getMarketingTemplate,
  interpolate,
  normalizeMarketingLocale,
} from "@/utils/marketing/templates";
import { renderMarketingEmailHtml, renderMarketingEmailText } from "@/utils/marketing/renderMarketingEmail";

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

export function isMarketingEmailConfigured() {
  return Boolean(getBookingResendApiKey());
}

function pdfCandidates(filename) {
  const cwd = process.cwd();
  return [
    join(cwd, "public", "marketing", filename),
    join(cwd, "docs", filename),
    join(cwd, "property_app", "public", "marketing", filename),
    join(cwd, "property_app", "docs", filename),
  ];
}

async function readPdfBuffer(filename) {
  for (const path of pdfCandidates(filename)) {
    if (existsSync(path)) {
      return readFile(path);
    }
  }

  const url = `${DEFAULT_PRODUCTION_APP_URL}/marketing/${filename}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 40 ? buf : null;
  } catch {
    return null;
  }
}

export async function loadMarketingAttachment(pdfKey) {
  if (!pdfKey || !MARKETING_PDFS[pdfKey]) return null;
  const { filename, label } = MARKETING_PDFS[pdfKey];
  const content = await readPdfBuffer(filename);
  if (!content) return { missing: true, filename, label };
  return {
    filename,
    attachAs: MARKETING_PDFS[pdfKey].attachAs || filename,
    label,
    content,
  };
}

/**
 * Send one 1:1 outreach letter. Caller must persist MarketingSend.
 * Pass `subject` + `body` to send an edited letter; otherwise the template is composed.
 */
export async function sendMarketingOutreachEmail({
  templateId,
  name,
  email,
    attachPdf = true,
  locale = "en",
  subject: subjectOverride,
  body: bodyOverride,
  vars = {},
}) {
  const template = getMarketingTemplate(templateId);
  if (!template) {
    return { ok: false, error: "Unknown template" };
  }

  const resend = getResend();
  const from = getMarketingEmailFrom();
  if (!resend) {
    return {
      ok: false,
      error: "Email is not configured (Resend key)",
    };
  }

  const lang = normalizeMarketingLocale(locale);
  const mergedVars = { firstName: name, name, ...vars };
  const generated = composeMarketingLetter(template, {
    ...mergedVars,
    locale: lang,
  });
  const subject = interpolate(
    String(subjectOverride || generated.subject).trim(),
    mergedVars,
    lang,
  ).slice(0, 200);
  const body = interpolate(
    String(bodyOverride || generated.body).trim(),
    mergedVars,
    lang,
  );

  if (subject.length < 3) {
    return { ok: false, error: "Subject is too short." };
  }
  if (body.length < 20) {
    return { ok: false, error: "The letter is too short." };
  }

  const { html } = renderMarketingEmailHtml({
    subject,
    body,
    previewText: generated.previewText,
  });
  const text = renderMarketingEmailText({ body });
  const to = String(email).trim().toLowerCase();

  /** @type {{ filename: string, content: Buffer }[]} */
  const attachments = [];
  let attachmentName = null;
  let attachmentMissing = false;

  if (attachPdf && template.pdfKey) {
    const file = await loadMarketingAttachment(template.pdfKey);
    if (file?.content) {
      const sendName = file.attachAs || file.filename;
      attachments.push({
        filename: sendName,
        content: file.content,
      });
      attachmentName = sendName;
    } else {
      attachmentMissing = true;
    }
  }

  const payload = {
    from,
    to,
    subject,
    html,
    text,
    replyTo: getMarketingReplyTo(),
  };
  if (attachments.length) {
    payload.attachments = attachments;
  }

  const { data, error } = await resend.emails.send(payload);
  if (error) {
    return {
      ok: false,
      error: error.message || "Resend rejected the send",
      subject,
      from,
      attachment: attachmentName,
    };
  }

  return {
    ok: true,
    resendId: data?.id || null,
    subject,
    from,
    attachment: attachmentName,
    attachmentMissing,
  };
}
