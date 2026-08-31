import User from "@/models/User";
import { OPS_ROLES, isOpsStaff } from "@/utils/opsAuth";

const MIN_OPS_PASSWORD_LENGTH = 10;

/**
 * Founder bootstrap is open only while zero ops staff have a Credentials password.
 * Once any admin/superadmin has passwordHash, public registration stays closed forever.
 *
 * @returns {Promise<number>}
 */
export async function countOpsUsersWithPassword() {
  return User.countDocuments({
    role: { $in: [...OPS_ROLES] },
    passwordHash: { $exists: true, $nin: [null, ""] },
  });
}

/**
 * @returns {Promise<boolean>}
 */
export async function isFounderBootstrapOpen() {
  const withPassword = await countOpsUsersWithPassword();
  return withPassword === 0;
}

/**
 * Prefer OPS_FOUNDER_EMAIL when set; otherwise the earliest admin/superadmin by createdAt.
 *
 * @returns {Promise<{
 *   needsBootstrap: boolean,
 *   founderEmail: string | null,
 *   emailLocked: boolean,
 * }>}
 */
export async function getFounderBootstrapState() {
  const needsBootstrap = await isFounderBootstrapOpen();
  if (!needsBootstrap) {
    return {
      needsBootstrap: false,
      founderEmail: null,
      emailLocked: false,
    };
  }

  const locked = String(process.env.OPS_FOUNDER_EMAIL || "")
    .trim()
    .toLowerCase();
  if (locked) {
    return {
      needsBootstrap: true,
      founderEmail: locked,
      emailLocked: true,
    };
  }

  const firstOps = await User.findOne({ role: { $in: [...OPS_ROLES] } })
    .sort({ createdAt: 1 })
    .select("email")
    .lean();

  return {
    needsBootstrap: true,
    founderEmail: firstOps?.email
      ? String(firstOps.email).trim().toLowerCase()
      : null,
    emailLocked: false,
  };
}

/**
 * Resolve which User may claim founder access for the given email.
 * Rejects when bootstrap is closed, email is locked to another address,
 * or no matching account exists yet (Google sign-in first).
 *
 * @param {string} rawEmail
 * @returns {Promise<{ ok: true, user: import("mongoose").Document } | { ok: false, status: number, error: string }>}
 */
export async function resolveFounderCandidate(rawEmail) {
  const open = await isFounderBootstrapOpen();
  if (!open) {
    return {
      ok: false,
      status: 403,
      error: "Founder setup is closed. An ops password already exists.",
    };
  }

  const email = String(rawEmail || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, status: 400, error: "Email is required." };
  }

  const locked = String(process.env.OPS_FOUNDER_EMAIL || "")
    .trim()
    .toLowerCase();
  if (locked && email !== locked) {
    return {
      ok: false,
      status: 403,
      error: "Founder email is locked by OPS_FOUNDER_EMAIL.",
    };
  }

  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escaped}$`, "i") },
  }).select("+passwordHash");

  if (!user) {
    return {
      ok: false,
      status: 404,
      error:
        "No account for this email. Sign in once on the main site with Google, then return here.",
    };
  }

  // Prefer an existing ops account; otherwise only allow the locked founder email
  // (or the sole candidate) so random guests cannot self-promote.
  if (!isOpsStaff(user.role)) {
    if (locked && email === locked) {
      return { ok: true, user };
    }
    return {
      ok: false,
      status: 403,
      error:
        "This account is not ops staff. Promote to admin first, or set OPS_FOUNDER_EMAIL.",
    };
  }

  return { ok: true, user };
}

export { MIN_OPS_PASSWORD_LENGTH };
