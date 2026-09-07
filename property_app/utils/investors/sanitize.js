import {
  isValidEmail,
  normalizeEmail,
  normalizeProfileUrl,
  stripHeaderSafe,
  stripText,
} from "@/utils/creators/sanitize";

/**
 * Public investor proposal form. Name, email, and proposal required.
 * `fax` is a honeypot — if filled, treat as spam.
 */
export function parseInvestorLeadInput(body) {
  const name = stripHeaderSafe(body?.name, 120);
  const email = normalizeEmail(body?.email);
  const organization = stripHeaderSafe(body?.organization, 160);
  const role = stripHeaderSafe(body?.role, 120);
  const firmUrl = normalizeProfileUrl(body?.firmUrl || body?.website);
  const proposal = stripText(body?.proposal || body?.message, 6000);
  const honeypot = String(body?.fax || "").trim();

  const errors = [];
  if (!name || name.length < 2) errors.push("name");
  if (!isValidEmail(email)) errors.push("email");
  if (!proposal || proposal.length < 20) errors.push("proposal");

  return {
    name,
    email,
    organization,
    role,
    firmUrl,
    proposal,
    honeypot: Boolean(honeypot),
    errors,
  };
}

export function serializeInvestorLead(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    organization: doc.organization || "",
    role: doc.role || "",
    firmUrl: doc.firmUrl || "",
    proposal: doc.proposal || "",
    source: doc.source || "investors",
    stage: doc.stage || "new",
    notes: doc.notes || "",
    emailSentAt: doc.emailSentAt || null,
    emailError: doc.emailError || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    stageHistory: doc.stageHistory || [],
  };
}
