/**
 * Data-driven booking / cancellation policy.
 *
 * Resolution for a NEW reservation (then snapshotted onto the booking):
 *   1. Property.bookingPolicy when any field is explicitly set
 *   2. Else host defaultCancellationPolicy
 *   3. Else platform DEFAULT_BOOKING_POLICY
 *
 * Eligibility for cancel/modify MUST prefer booking.cancellationPolicySnapshot
 * so later host/property edits never rewrite past stays.
 *
 * Check-in boundary is timezone-safe: local midnight of check-in day in the
 * policy IANA timeZone (falls back to UTC).
 */

/** @typedef {'guest' | 'host' | 'admin'} BookingPolicyActor */
/** @typedef {'cancel' | 'modify' | 'resend'} BookingPolicyAction */

export const DEFAULT_BOOKING_POLICY = Object.freeze({
  /** Hours before check-in when guest may cancel free. 0 + allowGuestCancel false = none. */
  freeCancelUntilHoursBeforeCheckIn: 48,
  modifyUntilHoursBeforeCheckIn: 48,
  allowGuestCancel: true,
  allowGuestModify: true,
  maxModifications: 3,
  /** IANA zone used to interpret check-in civil date as an absolute instant. */
  timeZone: "UTC",
});

/** Preset free-cancel windows offered in host Settings. */
export const CANCELLATION_PRESETS = Object.freeze([
  { id: "none", hours: 0, allowGuestCancel: false },
  { id: "12", hours: 12, allowGuestCancel: true },
  { id: "24", hours: 24, allowGuestCancel: true },
  { id: "48", hours: 48, allowGuestCancel: true },
  { id: "72", hours: 72, allowGuestCancel: true },
  { id: "custom", hours: null, allowGuestCancel: true },
]);

export const CANCELLATION_PRESET_IDS = CANCELLATION_PRESETS.map((p) => p.id);

const POLICY_KEYS = [
  "freeCancelUntilHoursBeforeCheckIn",
  "modifyUntilHoursBeforeCheckIn",
  "allowGuestCancel",
  "allowGuestModify",
  "maxModifications",
  "timeZone",
];

function coerceHours(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function coerceBool(value, fallback) {
  if (value === false) return false;
  if (value === true) return true;
  return fallback;
}

function isValidTimeZone(tz) {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(tz, fallback = "UTC") {
  return isValidTimeZone(tz) ? tz : fallback;
}

/**
 * Normalize a partial policy object onto defaults.
 * @param {object|null|undefined} raw
 */
export function normalizeBookingPolicy(raw = {}) {
  const timeZone = normalizeTimeZone(
    raw.timeZone,
    DEFAULT_BOOKING_POLICY.timeZone,
  );
  return {
    freeCancelUntilHoursBeforeCheckIn: coerceHours(
      raw.freeCancelUntilHoursBeforeCheckIn,
      DEFAULT_BOOKING_POLICY.freeCancelUntilHoursBeforeCheckIn,
    ),
    modifyUntilHoursBeforeCheckIn: coerceHours(
      raw.modifyUntilHoursBeforeCheckIn,
      DEFAULT_BOOKING_POLICY.modifyUntilHoursBeforeCheckIn,
    ),
    allowGuestCancel: coerceBool(
      raw.allowGuestCancel,
      DEFAULT_BOOKING_POLICY.allowGuestCancel,
    ),
    allowGuestModify: coerceBool(
      raw.allowGuestModify,
      DEFAULT_BOOKING_POLICY.allowGuestModify,
    ),
    maxModifications: coerceHours(
      raw.maxModifications,
      DEFAULT_BOOKING_POLICY.maxModifications,
    ),
    timeZone,
  };
}

/** True when the listing stored any explicit bookingPolicy field. */
export function propertyHasExplicitBookingPolicy(property) {
  const raw = property?.bookingPolicy;
  if (!raw || typeof raw !== "object") return false;
  return POLICY_KEYS.some((key) => raw[key] !== undefined && raw[key] !== null);
}

/**
 * Convert host Settings form / DB default into a booking policy object.
 * @param {object|null|undefined} hostDefault
 */
export function hostDefaultToBookingPolicy(hostDefault) {
  if (!hostDefault || typeof hostDefault !== "object") {
    return { ...DEFAULT_BOOKING_POLICY };
  }

  const presetId = String(hostDefault.preset || "48");
  const preset = CANCELLATION_PRESETS.find((p) => p.id === presetId);
  const timeZone = normalizeTimeZone(
    hostDefault.timeZone,
    DEFAULT_BOOKING_POLICY.timeZone,
  );

  if (!preset || presetId === "none") {
    return normalizeBookingPolicy({
      ...DEFAULT_BOOKING_POLICY,
      freeCancelUntilHoursBeforeCheckIn: 0,
      allowGuestCancel: false,
      modifyUntilHoursBeforeCheckIn: coerceHours(
        hostDefault.modifyUntilHoursBeforeCheckIn,
        DEFAULT_BOOKING_POLICY.modifyUntilHoursBeforeCheckIn,
      ),
      timeZone,
    });
  }

  const hours =
    presetId === "custom"
      ? coerceHours(
          hostDefault.customHours,
          DEFAULT_BOOKING_POLICY.freeCancelUntilHoursBeforeCheckIn,
        )
      : preset.hours;

  return normalizeBookingPolicy({
    ...DEFAULT_BOOKING_POLICY,
    freeCancelUntilHoursBeforeCheckIn: hours,
    allowGuestCancel: hours > 0,
    modifyUntilHoursBeforeCheckIn: coerceHours(
      hostDefault.modifyUntilHoursBeforeCheckIn,
      hours > 0 ? hours : DEFAULT_BOOKING_POLICY.modifyUntilHoursBeforeCheckIn,
    ),
    timeZone,
  });
}

/**
 * Persistable host Settings shape from a UI payload.
 * @param {object} input
 */
export function normalizeHostCancellationSettings(input = {}) {
  const preset = CANCELLATION_PRESET_IDS.includes(input.preset)
    ? input.preset
    : "48";
  const customHours = coerceHours(input.customHours, 48);
  const timeZone = normalizeTimeZone(input.timeZone, "UTC");
  return {
    preset,
    customHours: Math.min(Math.floor(customHours), 24 * 365),
    timeZone,
  };
}

/**
 * Merge property.bookingPolicy with defaults (legacy helper).
 * Prefer resolveEffectiveBookingPolicy for new work.
 */
export function resolveBookingPolicy(property) {
  return normalizeBookingPolicy(property?.bookingPolicy || {});
}

/**
 * Effective policy for a listing at booking time.
 * @param {{ property?: object|null, hostDefault?: object|null }} args
 */
export function resolveEffectiveBookingPolicy({
  property = null,
  hostDefault = null,
} = {}) {
  if (propertyHasExplicitBookingPolicy(property)) {
    return {
      policy: normalizeBookingPolicy({
        ...hostDefaultToBookingPolicy(hostDefault),
        ...property.bookingPolicy,
        timeZone:
          property.bookingPolicy?.timeZone ||
          hostDefault?.timeZone ||
          DEFAULT_BOOKING_POLICY.timeZone,
      }),
      source: "property",
    };
  }
  if (hostDefault && typeof hostDefault === "object") {
    return {
      policy: hostDefaultToBookingPolicy(hostDefault),
      source: "host_default",
    };
  }
  return {
    policy: { ...DEFAULT_BOOKING_POLICY },
    source: "platform_default",
  };
}

/**
 * Freeze policy onto a reservation document.
 */
export function snapshotCancellationPolicy(policy, source = "platform_default") {
  const normalized = normalizeBookingPolicy(policy);
  return {
    freeCancelUntilHoursBeforeCheckIn:
      normalized.freeCancelUntilHoursBeforeCheckIn,
    modifyUntilHoursBeforeCheckIn: normalized.modifyUntilHoursBeforeCheckIn,
    allowGuestCancel: normalized.allowGuestCancel,
    allowGuestModify: normalized.allowGuestModify,
    maxModifications: normalized.maxModifications,
    timeZone: normalized.timeZone,
    source,
    capturedAt: new Date(),
  };
}

/**
 * Policy used for eligibility: snapshot first, else live property/host.
 */
export function resolvePolicyForBooking(
  booking,
  property = null,
  hostDefault = null,
) {
  const snap = booking?.cancellationPolicySnapshot;
  if (snap && typeof snap === "object") {
    return normalizeBookingPolicy(snap);
  }
  return resolveEffectiveBookingPolicy({ property, hostDefault }).policy;
}

/**
 * Absolute check-in instant for YYYY-MM-DD in an IANA time zone (local midnight).
 * Timezone-safe replacement for UTC-midnight-only math.
 *
 * @param {string} checkInYmd
 * @param {string} [timeZone]
 * @returns {Date|null}
 */
export function checkInInstant(checkInYmd, timeZone = "UTC") {
  if (!checkInYmd || !/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd)) return null;
  const tz = normalizeTimeZone(timeZone, "UTC");

  // Start with UTC midnight guess, then correct using the zone's wall time.
  const [year, month, day] = checkInYmd.split("-").map(Number);
  let utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let i = 0; i < 3; i += 1) {
    const parts = dtf.formatToParts(new Date(utcMs));
    const get = (type) =>
      Number(parts.find((p) => p.type === type)?.value || 0);
    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const target = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    utcMs += target - asUtc;
  }

  return new Date(utcMs);
}

/** @deprecated Use checkInInstant — kept for existing imports. */
export function checkInUtcDate(checkInYmd) {
  return checkInInstant(checkInYmd, "UTC");
}

export function hoursUntilCheckIn(checkInYmd, now = new Date(), timeZone = "UTC") {
  const start = checkInInstant(checkInYmd, timeZone);
  if (!start) return null;
  return (start.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function todayYmdInTimeZone(now, timeZone) {
  const tz = normalizeTimeZone(timeZone, "UTC");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Central gate for cancel / modify / resend.
 * Prefers booking.cancellationPolicySnapshot when present.
 */
export function evaluateBookingPolicy(
  booking,
  property,
  action,
  now = new Date(),
  { actor = "guest", hostDefault = null } = {},
) {
  const policy = resolvePolicyForBooking(booking, property, hostDefault);
  const hours = hoursUntilCheckIn(
    booking?.checkIn,
    now,
    policy.timeZone || "UTC",
  );
  const base = {
    policy,
    hoursUntilCheckIn: hours,
  };

  if (!booking) {
    return {
      ...base,
      allowed: false,
      code: "not_found",
      reason: "Booking not found",
    };
  }

  if (booking.status === "cancelled") {
    return {
      ...base,
      allowed: false,
      code: "already_cancelled",
      reason: "This reservation is already cancelled",
    };
  }

  if (action === "resend") {
    const canResend =
      booking.status === "confirmed" ||
      (booking.status === "pending" &&
        (booking.paymentMode === "manual" || booking.paymentMode === "manual"));
    if (!canResend) {
      return {
        ...base,
        allowed: false,
        code: "not_confirmed",
        reason:
          "Only confirmed or pending (manual payment) bookings can resend emails",
      };
    }
    return { ...base, allowed: true, code: "ok" };
  }

  const today = todayYmdInTimeZone(now, policy.timeZone || "UTC");
  if (booking.checkOut && booking.checkOut <= today) {
    return {
      ...base,
      allowed: false,
      code: "stay_ended",
      reason: "This stay has already ended",
    };
  }

  if (actor === "host" || actor === "admin") {
    if (action === "cancel" || action === "modify") {
      if (booking.status !== "confirmed" && booking.status !== "pending") {
        return {
          ...base,
          allowed: false,
          code: "invalid_status",
          reason: "Only pending or confirmed bookings can be changed",
        };
      }
      return {
        ...base,
        allowed: true,
        code: "ok",
        refundEligible: action === "cancel",
      };
    }
  }

  if (action === "cancel") {
    if (!policy.allowGuestCancel) {
      return {
        ...base,
        allowed: false,
        code: "guest_cancel_disabled",
        reason: "This listing does not allow guest cancellations",
        refundEligible: false,
      };
    }
    if (hours == null) {
      return {
        ...base,
        allowed: false,
        code: "invalid_check_in",
        reason: "Invalid check-in date",
        refundEligible: false,
      };
    }
    if (hours < policy.freeCancelUntilHoursBeforeCheckIn) {
      return {
        ...base,
        allowed: false,
        code: "cancel_window_closed",
        reason: `Free cancellation closed (must cancel at least ${policy.freeCancelUntilHoursBeforeCheckIn} hours before check-in)`,
        refundEligible: false,
      };
    }
    return {
      ...base,
      allowed: true,
      code: "ok",
      refundEligible: true,
    };
  }

  if (action === "modify") {
    if (!policy.allowGuestModify) {
      return {
        ...base,
        allowed: false,
        code: "guest_modify_disabled",
        reason: "This listing does not allow date changes",
      };
    }
    const mods =
      Number(booking.modificationCount ?? booking.modificationCount) || 0;
    if (mods >= policy.maxModifications) {
      return {
        ...base,
        allowed: false,
        code: "max_modifications",
        reason: `Maximum of ${policy.maxModifications} date changes reached`,
      };
    }
    if (hours == null) {
      return {
        ...base,
        allowed: false,
        code: "invalid_check_in",
        reason: "Invalid check-in date",
      };
    }
    if (hours < policy.modifyUntilHoursBeforeCheckIn) {
      return {
        ...base,
        allowed: false,
        code: "modify_window_closed",
        reason: `Date changes closed (must modify at least ${policy.modifyUntilHoursBeforeCheckIn} hours before check-in)`,
      };
    }
    return { ...base, allowed: true, code: "ok" };
  }

  return {
    ...base,
    allowed: false,
    code: "unknown_action",
    reason: `Unknown action: ${action}`,
  };
}

/**
 * Human-readable summary for UI (guest-facing).
 */
export function describeBookingPolicy(policy = DEFAULT_BOOKING_POLICY) {
  const p = normalizeBookingPolicy(policy);
  const parts = [];
  if (!p.allowGuestCancel || p.freeCancelUntilHoursBeforeCheckIn <= 0) {
    parts.push("No free cancellation");
  } else {
    parts.push(
      `Free cancellation until ${p.freeCancelUntilHoursBeforeCheckIn} hours before check-in`,
    );
  }
  if (p.allowGuestModify) {
    parts.push(
      `Date changes until ${p.modifyUntilHoursBeforeCheckIn} hours before check-in (max ${p.maxModifications})`,
    );
  }
  return parts.join(". ") + ".";
}

/** Short guest-facing cancellation line for the booking card. */
export function describeCancellationPolicy(policy = DEFAULT_BOOKING_POLICY) {
  const p = normalizeBookingPolicy(policy);
  if (!p.allowGuestCancel || p.freeCancelUntilHoursBeforeCheckIn <= 0) {
    return "No free cancellation";
  }
  return `Free cancellation until ${p.freeCancelUntilHoursBeforeCheckIn} hours before check-in`;
}
