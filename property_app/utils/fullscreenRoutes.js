/** Routes that use a fullscreen layout without main nav chrome. */
export function isFullscreenRoute(pathname) {
  if (!pathname) return false;
  return pathname === "/onboarding" || pathname === "/login";
}
