import { isOpsStaff } from "@/utils/opsAuth";

/**
 * Guest catalogue is closed until public launch.
 * Default: beta (hosts and ops only).
 * Open the catalogue: NEXT_PUBLIC_LISTINGS_CATALOG_BETA=false
 */
export function isListingsCatalogBeta() {
  const raw = process.env.NEXT_PUBLIC_LISTINGS_CATALOG_BETA;
  if (raw == null || raw === "") return true;
  return raw !== "false" && raw !== "0";
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
