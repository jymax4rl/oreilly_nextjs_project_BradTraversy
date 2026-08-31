/**
 * Build /login URL so all sign-in entry points hit the Terms gate.
 * @param {string} [callbackUrl]
 */
export function getLoginUrl(callbackUrl) {
  const cb =
    callbackUrl && callbackUrl.startsWith("/")
      ? callbackUrl
      : callbackUrl || "/";
  const safe =
    typeof cb === "string" && cb.startsWith("/") && !cb.startsWith("//")
      ? cb
      : "/";
  return `/login?callbackUrl=${encodeURIComponent(safe)}`;
}
