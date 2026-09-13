import { isOpsStaff } from "@/utils/opsAuth";

/** Preview-lock hosts stay in the catalog, but listing pages and sitemaps stay private. */
export const PREVIEW_LOCKED_HOST_EMAILS = [];

export const PREVIEW_LOCKED_HOST_NAMES = [];

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeHostName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isPreviewLockedHostEmail(email) {
  return PREVIEW_LOCKED_HOST_EMAILS.includes(normalizeEmail(email));
}

export function isPreviewLockedHostName(name) {
  return PREVIEW_LOCKED_HOST_NAMES.includes(normalizeHostName(name));
}

export function isPreviewLockedHost(person = {}) {
  return (
    isPreviewLockedHostEmail(person.email) ||
    isPreviewLockedHostName(person.name) ||
    isPreviewLockedHostName(person.username)
  );
}

export function canUnlockPreviewListing(session) {
  return isOpsStaff(session?.user?.role);
}

/** Strip repeated preview-host names/emails from catalog HTML (RSC payload). */
export function redactPreviewLockedCatalogFields(properties) {
  const list = Array.isArray(properties) ? properties : [];
  return list.map((property) => {
    if (!property?.previewLocked) return property;
    return {
      ...property,
      host: property.host
        ? { ...property.host, name: null, image: property.host.image || null }
        : null,
      seller_info: property.seller_info
        ? { name: "", email: "", phone: "" }
        : property.seller_info,
    };
  });
}

export function isListingOwner(session, property) {
  if (!session?.user || !property) return false;
  const ownerId =
    property.owner?.toString?.() ?? String(property.owner ?? "");
  const userId =
    session.user.id?.toString?.() ?? String(session.user.id ?? "");
  return Boolean(ownerId && userId && ownerId === userId);
}
