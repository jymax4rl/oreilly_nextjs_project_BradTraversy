import AuditLog from "@/models/AuditLog";

export async function writeFoundingHostAudit({
  hostId,
  action,
  previousStatus = null,
  newStatus = null,
  previousExpiration = null,
  newExpiration = null,
  actor = null,
  reason = null,
  notes = null,
  meta = undefined,
}) {
  return AuditLog.create({
    host: hostId || null,
    action,
    previousStatus,
    newStatus,
    previousExpiration,
    newExpiration,
    actor: actor
      ? {
          id: actor.id || null,
          email: actor.email || null,
          name: actor.name || null,
        }
      : undefined,
    reason: reason || null,
    notes: notes || null,
    meta,
  });
}

export function serializeAuditLog(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    host: doc.host ? String(doc.host) : null,
    action: doc.action,
    previousStatus: doc.previousStatus || null,
    newStatus: doc.newStatus || null,
    previousExpiration: doc.previousExpiration
      ? new Date(doc.previousExpiration).toISOString()
      : null,
    newExpiration: doc.newExpiration
      ? new Date(doc.newExpiration).toISOString()
      : null,
    actor: doc.actor
      ? {
          id: doc.actor.id || null,
          email: doc.actor.email || null,
          name: doc.actor.name || null,
        }
      : null,
    reason: doc.reason || null,
    notes: doc.notes || null,
    meta: doc.meta || null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}
