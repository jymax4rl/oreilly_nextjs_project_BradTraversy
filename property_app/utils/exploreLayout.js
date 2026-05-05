/**
 * Routes that use the Airbnb-style mobile header + bottom tab bar.
 */
export function isExploreMobileLayout(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/admin") || pathname.startsWith("/host"))
    return false;
  if (pathname === "/properties/add") return false;
  return (
    pathname === "/" ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/saved-properties")
  );
}
