import { isOpsStaff } from "../opsAuth.js";

/**
 * Optional catalogue soft-launch gate.
 *
 * Default: OPEN (guests browse approved listings) — matches live isisel.com.
 * Close the public catalogue (hosts/ops preview only):
 *   NEXT_PUBLIC_LISTINGS_CATALOG_BETA=true
 */
export function isListingsCatalogBeta() {
  const raw = process.env.NEXT_PUBLIC_LISTINGS_CATALOG_BETA;
  if (raw == null || raw === "") return false;
  return raw === "true" || raw === "1";
}

export function isVerifiedHostUser(user) {
  if (!user) return false;
  return user.hostStatus === "verified" || user.role === "host";
}

/** True when this session may browse other hosts' listings. */
export function canBrowseListingCatalog(session) {
  if (!isListingsCatalogBeta()) return true;
  const user = session?.user;
  if (!user) return false;
  if (isOpsStaff(user.role)) return true;
  return isVerifiedHostUser(user);
}
