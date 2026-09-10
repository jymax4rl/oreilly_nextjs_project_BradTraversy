import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_BOOKING_POLICY,
  checkInInstant,
  describeCancellationPolicy,
  evaluateBookingPolicy,
  hostDefaultToBookingPolicy,
  hoursUntilCheckIn,
  normalizeHostCancellationSettings,
  resolveEffectiveBookingPolicy,
  resolvePolicyForBooking,
  snapshotCancellationPolicy,
} from "./bookingPolicy.js";

const BOOKING_BASE = {
  status: "confirmed",
  checkIn: "2026-10-10",
  checkOut: "2026-10-14",
  modificationCount: 0,
};

test("48h window allows cancel at exactly 48 hours before check-in (UTC)", () => {
  const policy = {
    ...DEFAULT_BOOKING_POLICY,
    freeCancelUntilHoursBeforeCheckIn: 48,
    allowGuestCancel: true,
    timeZone: "UTC",
  };
  const booking = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      policy,
      "host_default",
    ),
  };
  const now = new Date("2026-10-08T00:00:00.000Z");
  const decision = evaluateBookingPolicy(booking, null, "cancel", now, {
    actor: "guest",
  });
  assert.equal(decision.allowed, true);
  assert.equal(decision.refundEligible, true);
});

test("48h window blocks cancel just inside the window", () => {
  const policy = {
    ...DEFAULT_BOOKING_POLICY,
    freeCancelUntilHoursBeforeCheckIn: 48,
    allowGuestCancel: true,
    timeZone: "UTC",
  };
  const booking = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      policy,
      "host_default",
    ),
  };
  const now = new Date("2026-10-08T00:00:01.000Z");
  const decision = evaluateBookingPolicy(booking, null, "cancel", now, {
    actor: "guest",
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.code, "cancel_window_closed");
});

test("24h window still allows when 48h would already be closed", () => {
  const now = new Date("2026-10-08T12:00:00.000Z"); // 36h before check-in

  const booking24 = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      {
        ...DEFAULT_BOOKING_POLICY,
        freeCancelUntilHoursBeforeCheckIn: 24,
        allowGuestCancel: true,
        timeZone: "UTC",
      },
      "host_default",
    ),
  };
  assert.equal(
    evaluateBookingPolicy(booking24, null, "cancel", now, { actor: "guest" })
      .allowed,
    true,
  );

  const booking48 = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      {
        ...DEFAULT_BOOKING_POLICY,
        freeCancelUntilHoursBeforeCheckIn: 48,
        allowGuestCancel: true,
        timeZone: "UTC",
      },
      "host_default",
    ),
  };
  assert.equal(
    evaluateBookingPolicy(booking48, null, "cancel", now, { actor: "guest" })
      .allowed,
    false,
  );
});

test("host policy edit after reservation does not change snapshot eligibility", () => {
  const booking = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      {
        freeCancelUntilHoursBeforeCheckIn: 72,
        allowGuestCancel: true,
        timeZone: "UTC",
      },
      "host_default",
    ),
  };

  const liveProperty = {
    bookingPolicy: {
      allowGuestCancel: false,
      freeCancelUntilHoursBeforeCheckIn: 0,
    },
  };
  const liveHost = normalizeHostCancellationSettings({ preset: "none" });
  const now = new Date("2026-10-06T00:00:00.000Z"); // 96h before check-in

  const decision = evaluateBookingPolicy(
    booking,
    liveProperty,
    "cancel",
    now,
    { actor: "guest", hostDefault: liveHost },
  );
  assert.equal(decision.allowed, true);
  assert.equal(decision.policy.freeCancelUntilHoursBeforeCheckIn, 72);
});

test("multi-property host: listing override wins over host default for NEW stays", () => {
  const hostDefault = normalizeHostCancellationSettings({
    preset: "24",
    timeZone: "Africa/Dakar",
  });
  const propertyA = {
    bookingPolicy: {
      freeCancelUntilHoursBeforeCheckIn: 72,
      allowGuestCancel: true,
    },
  };
  const propertyB = { bookingPolicy: {} };

  const a = resolveEffectiveBookingPolicy({
    property: propertyA,
    hostDefault,
  });
  const b = resolveEffectiveBookingPolicy({
    property: propertyB,
    hostDefault,
  });

  assert.equal(a.source, "property");
  assert.equal(a.policy.freeCancelUntilHoursBeforeCheckIn, 72);
  assert.equal(b.source, "host_default");
  assert.equal(b.policy.freeCancelUntilHoursBeforeCheckIn, 24);
});

test("timezone-safe cutoff: America/New_York midnight differs from UTC", () => {
  const checkIn = "2026-07-10";
  const tz = "America/New_York";
  const localMidnight = checkInInstant(checkIn, tz);
  const utcMidnight = checkInInstant(checkIn, "UTC");
  assert.ok(localMidnight);
  assert.ok(utcMidnight);
  assert.notEqual(localMidnight.getTime(), utcMidnight.getTime());

  const booking = {
    ...BOOKING_BASE,
    checkIn,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      {
        ...DEFAULT_BOOKING_POLICY,
        freeCancelUntilHoursBeforeCheckIn: 24,
        allowGuestCancel: true,
        timeZone: tz,
      },
      "host_default",
    ),
  };

  const edge = new Date(localMidnight.getTime() - 24 * 60 * 60 * 1000);
  assert.equal(
    evaluateBookingPolicy(booking, null, "cancel", edge, { actor: "guest" })
      .allowed,
    true,
  );

  const inside = new Date(edge.getTime() + 1000);
  assert.equal(
    evaluateBookingPolicy(booking, null, "cancel", inside, { actor: "guest" })
      .allowed,
    false,
  );

  const hoursLocal = hoursUntilCheckIn(checkIn, inside, tz);
  const hoursUtc = hoursUntilCheckIn(checkIn, inside, "UTC");
  assert.ok(hoursLocal < 24);
  assert.ok(Math.abs(hoursLocal - hoursUtc) > 1);
});

test("none preset disables guest free cancellation", () => {
  const policy = hostDefaultToBookingPolicy({ preset: "none" });
  assert.equal(policy.allowGuestCancel, false);
  assert.equal(describeCancellationPolicy(policy), "No free cancellation");

  const booking = {
    ...BOOKING_BASE,
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      policy,
      "host_default",
    ),
  };
  const decision = evaluateBookingPolicy(
    booking,
    null,
    "cancel",
    new Date("2026-01-01T00:00:00.000Z"),
    { actor: "guest" },
  );
  assert.equal(decision.allowed, false);
  assert.equal(decision.code, "guest_cancel_disabled");
});

test("resolvePolicyForBooking prefers snapshot over live property", () => {
  const booking = {
    cancellationPolicySnapshot: snapshotCancellationPolicy(
      { freeCancelUntilHoursBeforeCheckIn: 12, allowGuestCancel: true },
      "host_default",
    ),
  };
  const property = {
    bookingPolicy: {
      freeCancelUntilHoursBeforeCheckIn: 72,
      allowGuestCancel: true,
    },
  };
  const policy = resolvePolicyForBooking(booking, property, null);
  assert.equal(policy.freeCancelUntilHoursBeforeCheckIn, 12);
});
