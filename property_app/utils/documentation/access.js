import { isOpsStaff } from "../opsAuth.js";

/**
 * Ops documentation access: staff role + Isisel staff email domain.
 *
 * Domain from (first match wins):
 *   OPS_EMAIL_DOMAIN | ISEL_OPS_EMAIL_DOMAIN | default "isisel.com"
 *
 * Optional allowlist (comma-separated full emails), server-only:
 *   OPS_DOCUMENTATION_EMAILS
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
  return isAuthorizedOpsDocumentationEmail(user.email);
}

/**
 * JWT / session token shape used by middleware.
 * @param {{ role?: string, email?: string } | null | undefined} token
 */
export function canAccessOpsDocumentationToken(token) {
  return canAccessOpsDocumentation(token);
}
