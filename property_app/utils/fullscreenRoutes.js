/** Routes that use a fullscreen layout without main nav chrome. */
export function isFullscreenRoute(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/ops")) return true;
  return (
    pathname === "/onboarding" ||
    pathname === "/login" ||
    pathname === "/properties/add"
  );
}
