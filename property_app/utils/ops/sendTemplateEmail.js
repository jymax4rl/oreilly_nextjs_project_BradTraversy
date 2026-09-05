import MarketingSend from "@/models/MarketingSend";
import { isOpsStaff } from "@/utils/opsAuth";
import {
  getMarketingTemplate,
  resolveMarketingVars,
} from "@/utils/marketing/templates";
import { sendMarketingOutreachEmail } from "@/utils/marketing/sendMarketingEmail";
import { resolveUserEmailLocale } from "@/utils/user/resolveUserLocale";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HOURLY_CAP = 25;
export const BATCH_MAX = 25;

export function firstNameFromUsername(name) {
  const text = String(name || "").trim();
  if (!text) return "";
  return text.split(/\s+/)[0].slice(0, 40);
}

export function serializeRecipient(user) {
  return {
    id: String(user._id),
    name: firstNameFromUsername(user.username) || user.username || "",
    email: String(user.email || "").trim().toLowerCase(),
    locale: resolveUserEmailLocale(user),
    hostStatus: user.hostStatus || "none",
    role: user.role || "guest",
  };
}

export function recipientBlockReason(user, { excludeEmail } = {}) {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) return "No valid email on file.";
  if (excludeEmail && email === excludeEmail) return "That is your own account.";
  if (user?.banned) return "This account is banned.";
  if (isOpsStaff(user?.role)) return "Staff accounts are skipped.";
  if (user?.isTrainingGuest) return "Training accounts are skipped.";
  return null;
}

export async function hourlySentCount(session) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const senderMatch = [];
  const senderId = String(session.user.id || "");
  const senderEmail = session.user.email || "";
  if (senderId) senderMatch.push({ "sentBy.id": senderId });
  if (senderEmail) senderMatch.push({ "sentBy.email": senderEmail });
  if (!senderMatch.length) return 0;
  return MarketingSend.countDocuments({
    createdAt: { $gte: hourAgo },
    status: "sent",
    isTest: { $ne: true },
    $or: senderMatch,
  });
}

export async function templateAlreadySent(email, templateId) {
  const row = await MarketingSend.findOne({
    recipientEmail: String(email || "").trim().toLowerCase(),
    templateId,
    status: "sent",
    isTest: { $ne: true },
  })
    .select("_id createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return row;
}

export async function deliverTemplateToRecipient({
  recipient,
  templateId,
  attachPdf,
  sentBy,
}) {
  const template = getMarketingTemplate(templateId);
  if (!template) {
    return { ok: false, error: "Unknown template.", recipient };
  }
  const locale = recipient.locale === "fr" ? "fr" : "en";
  const vars = resolveMarketingVars({ firstName: recipient.name });
  const result = await sendMarketingOutreachEmail({
    templateId,
    name: recipient.name,
    email: recipient.email,
    attachPdf,
    locale,
    vars,
  });
  const log = await MarketingSend.create({
    recipientName: recipient.name || "—",
    recipientEmail: recipient.email,
    templateId,
    locale,
    isTest: false,
    subject: result.subject || template.label,
    status: result.ok ? "sent" : "failed",
    channel: "resend",
    resendId: result.resendId || null,
    error: result.ok ? null : result.error || "Send failed",
    attachment: result.attachment || null,
    sentBy,
  });
  return {
    ok: Boolean(result.ok),
    error: result.ok ? null : result.error || "Send failed",
    locale,
    email: recipient.email,
    name: recipient.name,
    id: String(log._id),
    subject: result.subject || template.label,
  };
}
