/**
 * Pure Founding 100 / commission-entitlement logic.
 * No database or path aliases — safe to unit-test with node:test.
 */

export const PROGRAM_STATUS = Object.freeze({
  ACTIVE: "active",
  PAUSED: "paused",
});

export const FOUNDING_HOST_STATUS = Object.freeze({
  ACTIVE: "active",
  REVOKED: "revoked",
});

export const DISPLAY_STATUS = Object.freeze({
  NONE: "none",
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked",
});

export const AUDIT_ACTIONS = Object.freeze({
  FOUNDING_HOST_GRANTED: "FOUNDING_HOST_GRANTED",
  FOUNDING_HOST_REVOKED: "FOUNDING_HOST_REVOKED",
  FOUNDING_HOST_EXTENDED: "FOUNDING_HOST_EXTENDED",
  COMMISSION_FREE_GRANTED: "COMMISSION_FREE_GRANTED",
  COMMISSION_FREE_REVOKED: "COMMISSION_FREE_REVOKED",
  COMMISSION_FREE_EXTENDED: "COMMISSION_FREE_EXTENDED",
  PROGRAM_SETTINGS_UPDATED: "PROGRAM_SETTINGS_UPDATED",
});

export const WAIVER_REASON = Object.freeze({
  FOUNDING_HOST: "FOUNDING_HOST",
  MANUAL_COMMISSION_FREE: "MANUAL_COMMISSION_FREE",
});

export const GRANT_REASON = Object.freeze({
  AUTOMATIC_ELIGIBILITY: "AUTOMATIC_ELIGIBILITY",
  MANUAL_GRANT: "MANUAL_GRANT",
});

export const PROGRAM_DEFAULTS = Object.freeze({
  foundingHostLimit: 100,
  foundingHostCommissionRate: 0,
  foundingHostDurationYears: 3,
  programStatus: PROGRAM_STATUS.ACTIVE,
});

export const PLATFORM_COMMISSION_RATE_FALLBACK = 0.07;

export function clampCommissionRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return PLATFORM_COMMISSION_RATE_FALLBACK;
  return Math.min(1, Math.max(0, n));
}

export function spotsRemaining(claimedCount, limit) {
  return Math.max(0, Number(limit || 0) - Number(claimedCount || 0));
}

export function isProgramActive(programStatus) {
  return programStatus === PROGRAM_STATUS.ACTIVE;
}

/**
 * Auto-allocation fires only when a listing is newly approved and this is
 * the host's first approved listing. Host-application approval is not enough.
 */
export function shouldAllocateFoundingHostOnListingApproval({
  incomingStatus,
  previousStatus,
  otherApprovedListingCount = 0,
} = {}) {
  if (incomingStatus !== "approved") return false;
  if (previousStatus === "approved") return false;
  return Number(otherApprovedListingCount || 0) === 0;
}

export function canManageFoundingHostProgram(role) {
  return role === "admin" || role === "superadmin";
}

export function canOverrideFoundingHostLimit(role) {
  return role === "superadmin";
}

export function addYearsUtc(date, years) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  const y = Number(years);
  if (!Number.isFinite(y)) {
    throw new Error("Invalid duration");
  }
  const result = new Date(d.getTime());
  result.setUTCFullYear(result.getUTCFullYear() + y);
  return result;
}

export function isDateBefore(date, comparedTo) {
  const a = new Date(date).getTime();
  const b = new Date(comparedTo).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a < b;
}

/**
 * Commission-free founding period is active only while status is not revoked
 * and now is strictly before expiresAt. A boolean isFoundingHost is not enough.
 */
export function isFoundingHostCommissionActive(foundingHost, now = new Date()) {
  if (!foundingHost) return false;
  if (foundingHost.status === FOUNDING_HOST_STATUS.REVOKED) return false;
  if (!foundingHost.isFoundingHost) return false;
  if (!foundingHost.expiresAt) return false;
  return isDateBefore(now, foundingHost.expiresAt);
}

export function isManualCommissionOverrideActive(override, now = new Date()) {
  if (!override || override.enabled !== true) return false;
  const t = new Date(now).getTime();
  if (!Number.isFinite(t)) return false;
  if (override.startsAt) {
    const start = new Date(override.startsAt).getTime();
    if (Number.isFinite(start) && t < start) return false;
  }
  if (override.expiresAt) {
    const end = new Date(override.expiresAt).getTime();
    if (Number.isFinite(end) && t >= end) return false;
  }
  return true;
}

export function foundingHostDisplayStatus(foundingHost, now = new Date()) {
  if (!foundingHost?.number && !foundingHost?.isFoundingHost) {
    return DISPLAY_STATUS.NONE;
  }
  if (foundingHost.status === FOUNDING_HOST_STATUS.REVOKED) {
    return DISPLAY_STATUS.REVOKED;
  }
  if (!foundingHost.isFoundingHost) return DISPLAY_STATUS.NONE;
  if (!foundingHost.expiresAt || !isDateBefore(now, foundingHost.expiresAt)) {
    return DISPLAY_STATUS.EXPIRED;
  }
  return DISPLAY_STATUS.ACTIVE;
}

/** Permanent recognition badge — survives expiry, hidden after revoke. */
export function shouldShowFoundingHostBadge(foundingHost) {
  if (!foundingHost?.isFoundingHost) return false;
  if (!foundingHost.number) return false;
  return foundingHost.status !== FOUNDING_HOST_STATUS.REVOKED;
}

/**
 * Lowest applicable rate among standard, founding-host, and manual override.
 * Founding Host is preferred as the waiver reason when its rate wins or ties.
 */
export function resolveHostCommission({
  foundingHost,
  commissionOverride,
  programCommissionRate = PROGRAM_DEFAULTS.foundingHostCommissionRate,
  standardRate = PLATFORM_COMMISSION_RATE_FALLBACK,
  now = new Date(),
} = {}) {
  let commissionRate = clampCommissionRate(standardRate);
  let commissionWaived = false;
  let commissionWaiverReason = null;
  let source = "standard";

  if (isManualCommissionOverrideActive(commissionOverride, now)) {
    const overrideRate = clampCommissionRate(commissionOverride.rate);
    commissionRate = overrideRate;
    source = "manual_override";
    if (overrideRate === 0) {
      commissionWaived = true;
      commissionWaiverReason = WAIVER_REASON.MANUAL_COMMISSION_FREE;
    }
  }

  if (isFoundingHostCommissionActive(foundingHost, now)) {
    const fhRate = clampCommissionRate(programCommissionRate);
    if (fhRate <= commissionRate) {
      commissionRate = fhRate;
      source = "founding_host";
      if (fhRate === 0) {
        commissionWaived = true;
        commissionWaiverReason = WAIVER_REASON.FOUNDING_HOST;
      } else {
        commissionWaived = false;
        commissionWaiverReason = null;
      }
    }
  }

  return {
    commissionRate,
    commissionWaived,
    commissionWaiverReason,
    source,
  };
}

export function buildPricingCommissionFields({
  commission,
  resolved,
}) {
  const amount = Math.round((Number(commission) || 0) * 100) / 100;
  return {
    platformFee: amount,
    commissionAmount: amount,
    commissionRateApplied: resolved.commissionRate,
    commissionWaived: Boolean(resolved.commissionWaived),
    commissionWaiverReason: resolved.commissionWaived
      ? resolved.commissionWaiverReason
      : null,
  };
}

/**
 * Serialized atomic claim: increment claimedCount only when under the limit.
 * Models MongoDB findOneAndUpdate({ claimedCount: { $lt: limit } }, { $inc }).
 */
export function createAtomicClaimStore(initial = {}) {
  const state = {
    claimedCount: Number(initial.claimedCount) || 0,
    foundingHostLimit:
      initial.foundingHostLimit ?? PROGRAM_DEFAULTS.foundingHostLimit,
    programStatus: initial.programStatus || PROGRAM_STATUS.ACTIVE,
  };

  let chain = Promise.resolve();

  function claim({ requireActive = true, overrideLimit = false } = {}) {
    const run = async () => {
      if (requireActive && state.programStatus !== PROGRAM_STATUS.ACTIVE) {
        return { ok: false, reason: "paused" };
      }
      if (!overrideLimit && state.claimedCount >= state.foundingHostLimit) {
        return { ok: false, reason: "full" };
      }
      state.claimedCount += 1;
      return {
        ok: true,
        number: state.claimedCount,
        claimedCount: state.claimedCount,
      };
    };

    const next = chain.then(run, run);
    chain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return {
    claim,
    getState: () => ({ ...state }),
    setStatus(status) {
      state.programStatus = status;
    },
    setLimit(limit) {
      state.foundingHostLimit = Number(limit);
    },
  };
}

export function normalizeProgramSettings(input = {}) {
  const limit = Number(input.foundingHostLimit);
  const rate = Number(input.foundingHostCommissionRate);
  const years = Number(input.foundingHostDurationYears);
  const status = input.programStatus;

  const errors = [];
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
    errors.push("Founding Host limit must be a whole number of at least 1.");
  }
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    errors.push("Commission rate must be between 0 and 1 (e.g. 0 for 0%).");
  }
  if (!Number.isInteger(years) || years < 1 || years > 50) {
    errors.push("Duration must be a whole number of years between 1 and 50.");
  }
  if (status && status !== PROGRAM_STATUS.ACTIVE && status !== PROGRAM_STATUS.PAUSED) {
    errors.push("Program status must be active or paused.");
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      foundingHostLimit: limit,
      foundingHostCommissionRate: rate,
      foundingHostDurationYears: years,
      ...(status ? { programStatus: status } : {}),
    },
  };
}
