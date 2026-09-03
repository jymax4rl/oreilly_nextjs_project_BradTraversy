import { CREATOR_PLATFORMS } from "./constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function stripHeaderSafe(value, max = 200) {
  return String(value || "")
    .replace(/[\r\n\0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function stripText(value, max = 2000) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\0]/g, "")
    .trim()
    .slice(0, max);
}

export function isValidEmail(value) {
  const email = stripHeaderSafe(value, 254).toLowerCase();
  if (!email || email.length > 254) return false;
  if (!EMAIL_RE.test(email)) return false;
  if (email.includes("..")) return false;
  return true;
}

export function normalizeEmail(value) {
  return stripHeaderSafe(value, 254).toLowerCase();
}

export function normalizePlatform(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase();
  return CREATOR_PLATFORMS.includes(id) ? id : "";
}

export function normalizeProfileUrl(value) {
  const raw = stripHeaderSafe(value, 500);
  if (!raw) return "";
  let url = raw;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString().slice(0, 500);
  } catch {
    return "";
  }
}

/**
 * Public influencer form payload. Name + email required.
 * `website` is a honeypot — if filled, treat as spam.
 */
export function parseCreatorLeadInput(body) {
  const name = stripHeaderSafe(body?.name, 120);
  const email = normalizeEmail(body?.email);
  const platform = normalizePlatform(body?.platform);
  const profileUrl = normalizeProfileUrl(body?.profileUrl || body?.profile);
  const message = stripText(body?.message, 2000);
  const honeypot = String(body?.website || body?.company || "").trim();

  const errors = [];
  if (!name || name.length < 2) errors.push("name");
  if (!isValidEmail(email)) errors.push("email");

  return {
    name,
    email,
    platform,
    profileUrl,
    message,
    honeypot: Boolean(honeypot),
    errors,
  };
}

export function serializeCreatorLead(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    platform: doc.platform || "",
    profileUrl: doc.profileUrl || "",
    message: doc.message || "",
    source: doc.source || "influencers",
    stage: doc.stage || "new",
    notes: doc.notes || "",
    emailSentAt: doc.emailSentAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    stageHistory: doc.stageHistory || [],
  };
}
