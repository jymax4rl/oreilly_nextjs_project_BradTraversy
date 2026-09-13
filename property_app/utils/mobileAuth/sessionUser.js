/**
 * Shared session-like user shape for cookie sessions and Bearer JWTs.
 * Marketplace / host handlers can migrate to getAuthFromRequest without branching.
 *
 * @typedef {import('@/types/apiAuth').AuthUser} AuthUser
 * @typedef {import('@/types/apiAuth').AuthSession} AuthSession
 */

/**
 * Normalize a NextAuth session user or Mongo User document into AuthUser.
 *
 * @param {{
 *   _id?: unknown,
 *   id?: string,
 *   email?: string,
 *   username?: string,
 *   name?: string|null,
 *   image?: string|null,
 *   role?: string,
 *   hostStatus?: string,
 *   hasCompletedHostOnboarding?: boolean,
 *   banned?: boolean,
 * }} user
 * @returns {AuthUser|null}
 */
export function toAuthUser(user) {
  if (!user) return null;
  const id =
    typeof user.id === "string"
      ? user.id
      : user._id != null
        ? String(user._id)
        : "";
  if (!id) return null;
  return {
    id,
    email: user.email ? String(user.email) : "",
    name: user.username || user.name || null,
    image: user.image || null,
    role: typeof user.role === "string" ? user.role : "guest",
    hostStatus: typeof user.hostStatus === "string" ? user.hostStatus : "none",
    hasCompletedHostOnboarding: user.hasCompletedHostOnboarding === true,
    banned: user.banned === true,
  };
}

/**
 * @param {AuthUser} authUser
 * @returns {AuthSession}
 */
export function toAuthSession(authUser) {
  return { user: authUser };
}
