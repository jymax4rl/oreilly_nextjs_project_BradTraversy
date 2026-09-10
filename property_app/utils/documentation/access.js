import { isOpsStaff } from "../opsAuth.js";

/**
 * Ops documentation access.
 *
 * Default: any Ops staff role may open /documentation (same people who already
 * reach the console). Founders often sign into ops with a personal Gmail, so a
 * hard @isisel.com requirement made Docs clicks look broken (silent redirect
 * back to /ops).
 *
 * Optional harden (server-only):
 *   OPS_DOCUMENTATION_RESTRICT_EMAIL=1
 *     → require @OPS_EMAIL_DOMAIN (default isisel.com) OR allowlist
 *   OPS_DOCUMENTATION_EMAILS=a@x.com,b@y.com
 *     → always accepted when restrict mode is on (and also as extras)
 *
 * Never expose these values to the client bundle.
 */

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getOpsEmailDomain() {
  const raw =
    process.env.OPS_EMAIL_DOMAIN ||
    process.env.ISEL_OPS_EMAIL_DOMAIN ||
    "isisel.com";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
}

function documentationEmailAllowlist() {
  return new Set(
    String(process.env.OPS_DOCUMENTATION_EMAILS || "")
      .split(",")
      .map((part) => normalizeEmail(part))
      .filter(Boolean),
  );
}

function emailRestrictionEnabled() {
  return process.env.OPS_DOCUMENTATION_RESTRICT_EMAIL === "1";
}

/**
 * @param {string | null | undefined} email
 */
export function isAuthorizedOpsDocumentationEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return false;

  if (documentationEmailAllowlist().has(normalized)) return true;

  const domain = getOpsEmailDomain();
  if (!domain) return false;
  return normalized.endsWith(`@${domain}`);
}

/**
 * @param {{ role?: string, email?: string } | null | undefined} user
 */
export function canAccessOpsDocumentation(user) {
  if (!user) return false;
  if (!isOpsStaff(user.role)) return false;
  if (!emailRestrictionEnabled()) return true;
  return isAuthorizedOpsDocumentationEmail(user.email);
}

/**
 * JWT / session token shape used by middleware.
 * @param {{ role?: string, email?: string } | null | undefined} token
 */
export function canAccessOpsDocumentationToken(token) {
  return canAccessOpsDocumentation(token);
}
