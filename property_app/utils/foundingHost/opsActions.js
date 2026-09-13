import mongoose from "mongoose";
import User from "@/models/User";
import { tryAllocateFoundingHost } from "@/utils/foundingHost/allocate";
import { writeFoundingHostAudit } from "@/utils/foundingHost/audit";
import {
  AUDIT_ACTIONS,
  FOUNDING_HOST_STATUS,
  GRANT_REASON,
  canOverrideFoundingHostLimit,
  addYearsUtc,
} from "@/utils/foundingHost/logic";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";

function actorFromSession(session) {
  return {
    id: session?.user?.id || null,
    email: session?.user?.email || null,
    name: session?.user?.name || session?.user?.email || "Ops",
  };
}

async function loadUser(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { error: "Invalid host id", status: 400 };
  }
  const user = await User.findById(userId);
  if (!user) return { error: "Host not found", status: 404 };
  return { user };
}

export async function grantFoundingHostManually({
  userId,
  session,
  reason,
  notes,
  overrideLimit = false,
}) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  if (loaded.user.foundingHost?.number) {
    return { error: "This host already has a Founding Host number", status: 409 };
  }

  const settings = await getOrCreateProgramSettings();
  const remaining = Math.max(
    0,
    settings.foundingHostLimit - (settings.claimedCount || 0),
  );

  if (remaining <= 0 && !overrideLimit) {
    return {
      error:
        "All Founding Host positions are claimed. A superadmin override is required to assign another.",
      status: 409,
      code: "LIMIT_REACHED",
    };
  }

  if (remaining <= 0 && overrideLimit && !canOverrideFoundingHostLimit(session?.user?.role)) {
    return {
      error: "Only a superadmin can override the Founding Host limit.",
      status: 403,
      code: "OVERRIDE_FORBIDDEN",
    };
  }

  const result = await tryAllocateFoundingHost({
    userId,
    grantedBy: actor,
    grantReason: reason?.trim() || GRANT_REASON.MANUAL_GRANT,
    requireActive: false,
    overrideLimit: remaining <= 0 && overrideLimit,
    notes: notes?.trim() || null,
    notify: true,
  });

  if (!result.allocated) {
    if (result.reason === "already_granted") {
      return { error: "This host already has a Founding Host number", status: 409 };
    }
    if (result.reason === "full") {
      return {
        error:
          "All Founding Host positions are claimed. A superadmin override is required to assign another.",
        status: 409,
        code: "LIMIT_REACHED",
      };
    }
    return { error: "Could not assign Founding Host status", status: 400 };
  }

  return { ok: true, result };
}

export async function revokeFoundingHost({ userId, session, reason, notes }) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  const user = loaded.user;
  if (!user.foundingHost?.number) {
    return { error: "This host is not a Founding Host", status: 400 };
  }
  if (user.foundingHost.status === FOUNDING_HOST_STATUS.REVOKED) {
    return { error: "Founding Host status is already revoked", status: 409 };
  }

  const previousStatus = user.foundingHost.status || FOUNDING_HOST_STATUS.ACTIVE;
  const previousExpiration = user.foundingHost.expiresAt || null;

  user.foundingHost.status = FOUNDING_HOST_STATUS.REVOKED;
  // Recognition flag is turned off on revoke; the number remains claimed.
  user.foundingHost.isFoundingHost = false;
  await user.save();

  await writeFoundingHostAudit({
    hostId: user._id,
    action: AUDIT_ACTIONS.FOUNDING_HOST_REVOKED,
    previousStatus,
    newStatus: FOUNDING_HOST_STATUS.REVOKED,
    previousExpiration,
    newExpiration: previousExpiration,
    actor,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
    meta: { number: user.foundingHost.number },
  });

  return { ok: true, user };
}

export async function extendFoundingHost({
  userId,
  session,
  expiresAt,
  addYears,
  reason,
  notes,
}) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  const user = loaded.user;
  if (!user.foundingHost?.number) {
    return { error: "This host is not a Founding Host", status: 400 };
  }
  if (user.foundingHost.status === FOUNDING_HOST_STATUS.REVOKED) {
    return { error: "Revoked Founding Host status cannot be extended", status: 409 };
  }

  const previousExpiration = user.foundingHost.expiresAt || null;
  let nextExpires = null;
  if (expiresAt) {
    nextExpires = new Date(expiresAt);
  } else if (addYears) {
    const base = previousExpiration && new Date(previousExpiration) > new Date()
      ? previousExpiration
      : new Date();
    nextExpires = addYearsUtc(base, addYears);
  }

  if (!nextExpires || Number.isNaN(nextExpires.getTime())) {
    return { error: "A valid expiration date is required", status: 400 };
  }

  user.foundingHost.expiresAt = nextExpires;
  user.foundingHost.status = FOUNDING_HOST_STATUS.ACTIVE;
  user.foundingHost.isFoundingHost = true;
  await user.save();

  await writeFoundingHostAudit({
    hostId: user._id,
    action: AUDIT_ACTIONS.FOUNDING_HOST_EXTENDED,
    previousStatus: FOUNDING_HOST_STATUS.ACTIVE,
    newStatus: FOUNDING_HOST_STATUS.ACTIVE,
    previousExpiration,
    newExpiration: nextExpires,
    actor,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
    meta: { number: user.foundingHost.number },
  });

  return { ok: true, user };
}

export async function grantCommissionOverride({
  userId,
  session,
  rate = 0,
  startsAt,
  expiresAt,
  reason,
  notes,
}) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  const start = startsAt ? new Date(startsAt) : new Date();
  const end = expiresAt ? new Date(expiresAt) : null;
  if (Number.isNaN(start.getTime())) {
    return { error: "Invalid start date", status: 400 };
  }
  if (!end || Number.isNaN(end.getTime())) {
    return { error: "An expiration date is required", status: 400 };
  }
  if (end <= start) {
    return { error: "Expiration must be after the start date", status: 400 };
  }

  const nRate = Number(rate);
  if (!Number.isFinite(nRate) || nRate < 0 || nRate > 1) {
    return { error: "Commission rate must be between 0 and 1", status: 400 };
  }

  const user = loaded.user;
  const previousExpiration = user.commissionOverride?.expiresAt || null;
  const previousStatus = user.commissionOverride?.enabled ? "active" : "none";

  user.commissionOverride = {
    enabled: true,
    rate: nRate,
    startsAt: start,
    expiresAt: end,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
    grantedBy:
      actor.id && mongoose.Types.ObjectId.isValid(String(actor.id))
        ? new mongoose.Types.ObjectId(String(actor.id))
        : null,
    grantedAt: new Date(),
  };
  await user.save();

  await writeFoundingHostAudit({
    hostId: user._id,
    action: AUDIT_ACTIONS.COMMISSION_FREE_GRANTED,
    previousStatus,
    newStatus: "active",
    previousExpiration,
    newExpiration: end,
    actor,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
    meta: {
      rate: nRate,
      consumesFoundingHostSpot: false,
    },
  });

  return { ok: true, user };
}

export async function revokeCommissionOverride({ userId, session, reason, notes }) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  const user = loaded.user;
  if (!user.commissionOverride?.enabled) {
    return { error: "No active commission override to revoke", status: 400 };
  }

  const previousExpiration = user.commissionOverride.expiresAt || null;
  user.commissionOverride.enabled = false;
  await user.save();

  await writeFoundingHostAudit({
    hostId: user._id,
    action: AUDIT_ACTIONS.COMMISSION_FREE_REVOKED,
    previousStatus: "active",
    newStatus: "revoked",
    previousExpiration,
    newExpiration: previousExpiration,
    actor,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
  });

  return { ok: true, user };
}

export async function extendCommissionOverride({
  userId,
  session,
  expiresAt,
  reason,
  notes,
}) {
  const actor = actorFromSession(session);
  const loaded = await loadUser(userId);
  if (loaded.error) return loaded;

  const user = loaded.user;
  if (!user.commissionOverride?.enabled) {
    return { error: "No active commission override to extend", status: 400 };
  }

  const next = new Date(expiresAt);
  if (Number.isNaN(next.getTime())) {
    return { error: "A valid expiration date is required", status: 400 };
  }

  const previousExpiration = user.commissionOverride.expiresAt || null;
  user.commissionOverride.expiresAt = next;
  await user.save();

  await writeFoundingHostAudit({
    hostId: user._id,
    action: AUDIT_ACTIONS.COMMISSION_FREE_EXTENDED,
    previousStatus: "active",
    newStatus: "active",
    previousExpiration,
    newExpiration: next,
    actor,
    reason: reason?.trim() || null,
    notes: notes?.trim() || null,
  });

  return { ok: true, user };
}
