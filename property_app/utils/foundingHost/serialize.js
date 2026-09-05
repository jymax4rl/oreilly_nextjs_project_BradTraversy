import {
  foundingHostDisplayStatus,
  shouldShowFoundingHostBadge,
  isFoundingHostCommissionActive,
  isManualCommissionOverrideActive,
  spotsRemaining,
} from "@/utils/foundingHost/logic";

export function serializeFoundingHostPublic(user, now = new Date()) {
  const fh = user?.foundingHost;
  if (!shouldShowFoundingHostBadge(fh)) return null;
  return {
    isFoundingHost: true,
    number: fh.number,
    expiresAt: fh.expiresAt ? new Date(fh.expiresAt).toISOString() : null,
    commissionActive: isFoundingHostCommissionActive(fh, now),
  };
}

export function serializeFoundingHostOps(user, now = new Date()) {
  const fh = user?.foundingHost || {};
  const override = user?.commissionOverride || {};
  return {
    id: String(user._id),
    username: user.username || "",
    email: user.email || "",
    image: user.image || null,
    hostStatus: user.hostStatus || "none",
    foundingHost: {
      isFoundingHost: Boolean(fh.isFoundingHost),
      number: fh.number || null,
      grantedAt: fh.grantedAt ? new Date(fh.grantedAt).toISOString() : null,
      expiresAt: fh.expiresAt ? new Date(fh.expiresAt).toISOString() : null,
      grantedBy: fh.grantedBy != null ? String(fh.grantedBy) : null,
      grantReason: fh.grantReason || null,
      status: foundingHostDisplayStatus(fh, now),
      storedStatus: fh.status || null,
      badge: shouldShowFoundingHostBadge(fh),
      commissionActive: isFoundingHostCommissionActive(fh, now),
    },
    commissionOverride: {
      enabled: Boolean(override.enabled),
      active: isManualCommissionOverrideActive(override, now),
      rate: override.rate == null ? null : Number(override.rate),
      startsAt: override.startsAt ? new Date(override.startsAt).toISOString() : null,
      expiresAt: override.expiresAt
        ? new Date(override.expiresAt).toISOString()
        : null,
      reason: override.reason || null,
      notes: override.notes || null,
      grantedBy: override.grantedBy ? String(override.grantedBy) : null,
      grantedAt: override.grantedAt
        ? new Date(override.grantedAt).toISOString()
        : null,
    },
  };
}

export function serializeProgramPublicStats(settings) {
  const claimedCount = Number(settings?.claimedCount) || 0;
  const foundingHostLimit = Number(settings?.foundingHostLimit) || 0;
  const remaining = spotsRemaining(claimedCount, foundingHostLimit);
  return {
    claimedCount,
    foundingHostLimit,
    spotsRemaining: remaining,
    isFull: remaining <= 0,
    programStatus: settings?.programStatus || "active",
    foundingHostCommissionRate:
      settings?.foundingHostCommissionRate == null
        ? 0
        : Number(settings.foundingHostCommissionRate),
    foundingHostDurationYears:
      Number(settings?.foundingHostDurationYears) || 0,
  };
}
