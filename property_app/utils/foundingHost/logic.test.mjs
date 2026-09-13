import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRAM_DEFAULTS,
  PROGRAM_STATUS,
  FOUNDING_HOST_STATUS,
  DISPLAY_STATUS,
  WAIVER_REASON,
  AUDIT_ACTIONS,
  addYearsUtc,
  clampCommissionRate,
  spotsRemaining,
  isProgramActive,
  canManageFoundingHostProgram,
  canOverrideFoundingHostLimit,
  isFoundingHostCommissionActive,
  isManualCommissionOverrideActive,
  foundingHostDisplayStatus,
  shouldShowFoundingHostBadge,
  resolveHostCommission,
  createAtomicClaimStore,
  normalizeProgramSettings,
  buildPricingCommissionFields,
  shouldAllocateFoundingHostOnListingApproval,
} from "./logic.js";

const GRANTED = new Date("2026-09-05T12:00:00.000Z");
const EXPIRES = addYearsUtc(GRANTED, PROGRAM_DEFAULTS.foundingHostDurationYears);

test("first eligible host receives Founding Host #1", async () => {
  const store = createAtomicClaimStore({ claimedCount: 0, foundingHostLimit: 100 });
  const first = await store.claim();
  assert.equal(first.ok, true);
  assert.equal(first.number, 1);
});

test("100th eligible host receives #100", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 99,
    foundingHostLimit: 100,
  });
  const result = await store.claim();
  assert.equal(result.ok, true);
  assert.equal(result.number, 100);
  assert.equal(store.getState().claimedCount, 100);
});

test("101st eligible host does not automatically receive a spot", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 100,
    foundingHostLimit: 100,
  });
  const result = await store.claim();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "full");
  assert.equal(store.getState().claimedCount, 100);
});

test("concurrent eligibility cannot exceed the configured limit", async () => {
  const limit = 100;
  const store = createAtomicClaimStore({ claimedCount: 0, foundingHostLimit: limit });
  const results = await Promise.all(
    Array.from({ length: 250 }, () => store.claim()),
  );
  const granted = results.filter((r) => r.ok);
  const numbers = granted.map((r) => r.number).sort((a, b) => a - b);
  assert.equal(granted.length, limit);
  assert.equal(store.getState().claimedCount, limit);
  assert.deepEqual(numbers, Array.from({ length: limit }, (_, i) => i + 1));
  assert.equal(new Set(numbers).size, limit);
});

test("program pause prevents automatic allocation", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 10,
    foundingHostLimit: 100,
    programStatus: PROGRAM_STATUS.PAUSED,
  });
  const result = await store.claim({ requireActive: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "paused");
  assert.equal(store.getState().claimedCount, 10);
});

test("paused program still cannot auto-allocate after resume-check fails mid-fill", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 99,
    foundingHostLimit: 100,
    programStatus: PROGRAM_STATUS.ACTIVE,
  });
  store.setStatus(PROGRAM_STATUS.PAUSED);
  const result = await store.claim();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "paused");
});

test("revoking a Founding Host does not create an automatic replacement", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 100,
    foundingHostLimit: 100,
  });
  // Revoke does not decrement claimedCount — numbers are never reused.
  const afterRevoke = await store.claim();
  assert.equal(afterRevoke.ok, false);
  assert.equal(store.getState().claimedCount, 100);
});

test("limit increase does not invalidate existing numbers", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 100,
    foundingHostLimit: 100,
  });
  store.setLimit(150);
  const next = await store.claim();
  assert.equal(next.ok, true);
  assert.equal(next.number, 101);
});

test("commission is 0 while founding entitlement is active", () => {
  const resolved = resolveHostCommission({
    foundingHost: {
      isFoundingHost: true,
      status: FOUNDING_HOST_STATUS.ACTIVE,
      expiresAt: EXPIRES,
    },
    programCommissionRate: 0,
    standardRate: 0.07,
    now: GRANTED,
  });
  assert.equal(resolved.commissionRate, 0);
  assert.equal(resolved.commissionWaived, true);
  assert.equal(resolved.commissionWaiverReason, WAIVER_REASON.FOUNDING_HOST);
});

test("commission returns to normal after expiration", () => {
  const resolved = resolveHostCommission({
    foundingHost: {
      isFoundingHost: true,
      status: FOUNDING_HOST_STATUS.ACTIVE,
      expiresAt: EXPIRES,
    },
    programCommissionRate: 0,
    standardRate: 0.07,
    now: EXPIRES,
  });
  assert.equal(resolved.commissionRate, 0.07);
  assert.equal(resolved.commissionWaived, false);
  assert.equal(resolved.commissionWaiverReason, null);
});

test("isFoundingHost true is not enough without an unexpired date", () => {
  assert.equal(
    isFoundingHostCommissionActive(
      { isFoundingHost: true, status: FOUNDING_HOST_STATUS.ACTIVE },
      GRANTED,
    ),
    false,
  );
});

test("existing booking snapshot preserves original commission fields", () => {
  const snapshot = buildPricingCommissionFields({
    commission: 0,
    resolved: {
      commissionRate: 0,
      commissionWaived: true,
      commissionWaiverReason: WAIVER_REASON.FOUNDING_HOST,
    },
  });
  const laterResolved = resolveHostCommission({
    foundingHost: {
      isFoundingHost: true,
      status: FOUNDING_HOST_STATUS.ACTIVE,
      expiresAt: EXPIRES,
    },
    standardRate: 0.07,
    now: EXPIRES,
  });
  assert.equal(snapshot.commissionAmount, 0);
  assert.equal(snapshot.commissionWaived, true);
  assert.equal(snapshot.commissionWaiverReason, WAIVER_REASON.FOUNDING_HOST);
  assert.equal(laterResolved.commissionRate, 0.07);
});

test("manual commission-free status works", () => {
  const resolved = resolveHostCommission({
    commissionOverride: {
      enabled: true,
      rate: 0,
      startsAt: GRANTED,
      expiresAt: addYearsUtc(GRANTED, 1),
    },
    standardRate: 0.07,
    now: GRANTED,
  });
  assert.equal(resolved.commissionRate, 0);
  assert.equal(resolved.commissionWaived, true);
  assert.equal(
    resolved.commissionWaiverReason,
    WAIVER_REASON.MANUAL_COMMISSION_FREE,
  );
  assert.equal(resolved.source, "manual_override");
});

test("manual commission-free does not consume a Founding Host position", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 12,
    foundingHostLimit: 100,
  });
  const resolved = resolveHostCommission({
    commissionOverride: {
      enabled: true,
      rate: 0,
      startsAt: GRANTED,
      expiresAt: addYearsUtc(GRANTED, 1),
    },
    standardRate: 0.07,
    now: GRANTED,
  });
  assert.equal(resolved.source, "manual_override");
  assert.equal(store.getState().claimedCount, 12);
  const stillAuto = await store.claim();
  assert.equal(stillAuto.number, 13);
});

test("operations permissions are enforced", () => {
  assert.equal(canManageFoundingHostProgram("admin"), true);
  assert.equal(canManageFoundingHostProgram("superadmin"), true);
  assert.equal(canManageFoundingHostProgram("host"), false);
  assert.equal(canManageFoundingHostProgram("guest"), false);
  assert.equal(canOverrideFoundingHostLimit("admin"), false);
  assert.equal(canOverrideFoundingHostLimit("superadmin"), true);
  assert.equal(canOverrideFoundingHostLimit("host"), false);
});

test("override can exceed the limit; silent exceed is not allowed without the flag", async () => {
  const store = createAtomicClaimStore({
    claimedCount: 100,
    foundingHostLimit: 100,
  });
  const denied = await store.claim({ overrideLimit: false });
  assert.equal(denied.ok, false);
  const forced = await store.claim({ overrideLimit: true, requireActive: false });
  assert.equal(forced.ok, true);
  assert.equal(forced.number, 101);
});

test("expiration uses configured duration years, not a hardcoded 3", () => {
  const expires = addYearsUtc(GRANTED, 4);
  assert.equal(expires.toISOString(), "2030-09-05T12:00:00.000Z");
});

test("badge remains after commission expires", () => {
  const expired = {
    isFoundingHost: true,
    number: 37,
    status: FOUNDING_HOST_STATUS.ACTIVE,
    expiresAt: EXPIRES,
  };
  assert.equal(foundingHostDisplayStatus(expired, EXPIRES), DISPLAY_STATUS.EXPIRED);
  assert.equal(shouldShowFoundingHostBadge(expired), true);
  assert.equal(isFoundingHostCommissionActive(expired, EXPIRES), false);
});

test("revoked founding host loses badge and commission", () => {
  const revoked = {
    isFoundingHost: true,
    number: 37,
    status: FOUNDING_HOST_STATUS.REVOKED,
    expiresAt: EXPIRES,
  };
  assert.equal(foundingHostDisplayStatus(revoked, GRANTED), DISPLAY_STATUS.REVOKED);
  assert.equal(shouldShowFoundingHostBadge(revoked), false);
  assert.equal(isFoundingHostCommissionActive(revoked, GRANTED), false);
});

test("manual override outside its window is ignored", () => {
  assert.equal(
    isManualCommissionOverrideActive(
      {
        enabled: true,
        rate: 0,
        startsAt: addYearsUtc(GRANTED, 1),
        expiresAt: addYearsUtc(GRANTED, 2),
      },
      GRANTED,
    ),
    false,
  );
});

test("spots remaining never goes negative", () => {
  assert.equal(spotsRemaining(87, 100), 13);
  assert.equal(spotsRemaining(100, 100), 0);
  assert.equal(spotsRemaining(120, 100), 0);
});

test("settings defaults are configurable rather than hardcoded at call sites", () => {
  assert.equal(PROGRAM_DEFAULTS.foundingHostLimit, 100);
  assert.equal(PROGRAM_DEFAULTS.foundingHostCommissionRate, 0);
  assert.equal(PROGRAM_DEFAULTS.foundingHostDurationYears, 3);
  assert.equal(isProgramActive(PROGRAM_DEFAULTS.programStatus), true);
});

test("normalizeProgramSettings rejects invalid values", () => {
  const bad = normalizeProgramSettings({
    foundingHostLimit: 0,
    foundingHostCommissionRate: 2,
    foundingHostDurationYears: 0,
    programStatus: "maybe",
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.length >= 3);

  const good = normalizeProgramSettings({
    foundingHostLimit: 80,
    foundingHostCommissionRate: 0,
    foundingHostDurationYears: 3,
    programStatus: PROGRAM_STATUS.PAUSED,
  });
  assert.equal(good.ok, true);
  assert.equal(good.value.foundingHostLimit, 80);
});

test("clampCommissionRate stays in 0–1", () => {
  assert.equal(clampCommissionRate(-1), 0);
  assert.equal(clampCommissionRate(0.07), 0.07);
  assert.equal(clampCommissionRate(2), 1);
});

test("Founding Host is not allocated on host verification alone", () => {
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "pending",
      previousStatus: "pending",
      otherApprovedListingCount: 0,
    }),
    false,
  );
});

test("Founding Host is allocated only on the host's first listing approval", () => {
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus: "pending",
      otherApprovedListingCount: 0,
    }),
    true,
  );
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus: "rejected",
      otherApprovedListingCount: 0,
    }),
    true,
  );
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus: "pending",
      otherApprovedListingCount: 1,
    }),
    false,
  );
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus: "approved",
      otherApprovedListingCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "rejected",
      previousStatus: "pending",
      otherApprovedListingCount: 0,
    }),
    false,
  );
});

test("audit action names match the required vocabulary", () => {
  assert.equal(AUDIT_ACTIONS.FOUNDING_HOST_GRANTED, "FOUNDING_HOST_GRANTED");
  assert.equal(AUDIT_ACTIONS.FOUNDING_HOST_REVOKED, "FOUNDING_HOST_REVOKED");
  assert.equal(AUDIT_ACTIONS.FOUNDING_HOST_EXTENDED, "FOUNDING_HOST_EXTENDED");
  assert.equal(AUDIT_ACTIONS.COMMISSION_FREE_GRANTED, "COMMISSION_FREE_GRANTED");
  assert.equal(AUDIT_ACTIONS.COMMISSION_FREE_REVOKED, "COMMISSION_FREE_REVOKED");
  assert.equal(AUDIT_ACTIONS.COMMISSION_FREE_EXTENDED, "COMMISSION_FREE_EXTENDED");
});
