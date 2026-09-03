/**
 * Host operations workspace (Mews-like), separate from guest marketplace
 * and from /ops (staff / superadmin).
 */

export function isHostApplicantPath(pathname) {
  if (!pathname) return false;
  return (
    pathname === "/host/onboarding" ||
    pathname.startsWith("/host/onboarding/") ||
    pathname === "/host/pending" ||
    pathname.startsWith("/host/pending/")
  );
}

/** Verified-host console — own chrome, no guest nav. */
export function isHostWorkspacePath(pathname) {
  if (!pathname) return false;
  if (isHostApplicantPath(pathname)) return false;
  if (pathname === "/host" || pathname.startsWith("/host/")) return true;
  return /^\/properties\/[^/]+\/(calendar|rates|reservations)\/?$/.test(
    pathname,
  );
}
