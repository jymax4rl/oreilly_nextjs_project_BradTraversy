import { isOpsStaff } from "@/utils/opsAuth";

/** Public catalog listings for these hosts stay visible but are not bookable. */
export const PREVIEW_LOCKED_HOST_EMAILS = ["camara23.pro@gmail.com"];

export const PREVIEW_LOCKED_HOST_NAMES = ["jimmeh camara", "jimmeh gakou"];

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

export function isListingOwner(session, property) {
  if (!session?.user || !property) return false;
  const ownerId =
    property.owner?.toString?.() ?? String(property.owner ?? "");
  const userId =
    session.user.id?.toString?.() ?? String(session.user.id ?? "");
  return Boolean(ownerId && userId && ownerId === userId);
}
