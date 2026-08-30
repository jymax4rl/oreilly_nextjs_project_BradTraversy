/**
 * Routes that use the Airbnb-style mobile header + bottom tab bar.
 */
export function isExploreMobileLayout(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/admin") || pathname.startsWith("/host"))
    return false;
  // Fullscreen host flows — no bottom tab bar / currency chrome
  if (
    pathname === "/properties/add" ||
    pathname.startsWith("/properties/add/")
  ) {
    return false;
  }
  return (
    pathname === "/" ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/saved-properties")
  );
}
