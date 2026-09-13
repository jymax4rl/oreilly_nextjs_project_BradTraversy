/**
 * Shared session-like user shape for cookie sessions and Bearer JWTs.
 * Marketplace handlers can migrate to getAuthFromRequest without branching.
 *
 * @param {{ _id?: unknown, id?: string, email?: string, username?: string, name?: string, image?: string|null }} user
 * @returns {{ id: string, email: string, name: string|null, image: string|null }}
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
  };
}

/**
 * @param {{ id: string, email: string, name: string|null, image: string|null }} authUser
 * @returns {{ user: typeof authUser }}
 */
export function toAuthSession(authUser) {
  return { user: authUser };
}
