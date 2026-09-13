/** Roles that may access the ops / staff console and legacy `/admin/*` tools. */
export const OPS_ROLES = Object.freeze(["admin", "superadmin"]);

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isOpsStaff(role) {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role) {
  return role === "superadmin";
}
