import Property from "@/models/Property";

export async function getPropertyForApi(propertyId) {
  if (!propertyId) return null;
  try {
    return await Property.findById(propertyId).lean();
  } catch {
    return null;
  }
}

export function isPropertyOwner(property, sessionUserId) {
  if (!property?.owner || !sessionUserId) return false;
  return String(property.owner) === String(sessionUserId);
}

export function assertVerifiedHost(session) {
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Sign in required" };
  }
  if (session.user.hostStatus !== "verified") {
    return { ok: false, status: 403, message: "Verified host access required" };
  }
  return { ok: true };
}
