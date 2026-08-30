/**
 * Data-driven booking / cancellation policy.
 *
 * Property.bookingPolicy (optional) overrides defaults. CRUD (guest cancel/modify)
 * and UI gating should call evaluateBookingPolicy — do not hardcode windows in
 * components.
 *
 * Defaults (when property has no bookingPolicy):
 * - Guest free cancel until 48 hours before check-in (UTC midnight of checkIn)
 * - Guest modify dates until 48 hours before check-in
 * - Max 3 guest modifications
 * - After the free window: guest cannot self-cancel or modify (contact host)
 * - Host can always cancel/modify active (non-cancelled, not past check-out) stays
 */

/** @typedef {'guest' | 'host' | 'admin'} BookingPolicyActor */
/** @typedef {'cancel' | 'modify' | 'resend'} BookingPolicyAction */

export const DEFAULT_BOOKING_POLICY = Object.freeze({
  /** Hours before check-in (UTC start of checkIn day) when guest may cancel free. */
  freeCancelUntilHoursBeforeCheckIn: 48,
  /** Hours before check-in when guest may change dates. */
  modifyUntilHoursBeforeCheckIn: 48,
  allowGuestCancel: true,
  allowGuestModify: true,
  maxModifications: 3,
});

/**
 * Merge property.bookingPolicy with defaults (numbers coerced; invalid ignored).
 * @param {object|null|undefined} property
 */
export function resolveBookingPolicy(property) {
  const raw = property?.bookingPolicy || {};
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    freeCancelUntilHoursBeforeCheckIn: num(
      raw.freeCancelUntilHoursBeforeCheckIn,
      DEFAULT_BOOKING_POLICY.freeCancelUntilHoursBeforeCheckIn,
    ),
    modifyUntilHoursBeforeCheckIn: num(
      raw.modifyUntilHoursBeforeCheckIn,
      DEFAULT_BOOKING_POLICY.modifyUntilHoursBeforeCheckIn,
    ),
    allowGuestCancel:
      raw.allowGuestCancel === false
        ? false
        : DEFAULT_BOOKING_POLICY.allowGuestCancel,
    allowGuestModify:
      raw.allowGuestModify === false
        ? false
        : DEFAULT_BOOKING_POLICY.allowGuestModify,
    maxModifications: num(
      raw.maxModifications,
      DEFAULT_BOOKING_POLICY.maxModifications,
    ),
  };
}

/**
 * Check-in instant = UTC midnight of YYYY-MM-DD.
 * @param {string} checkInYmd
 * @returns {Date|null}
 */
export function checkInUtcDate(checkInYmd) {
  if (!checkInYmd || !/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd)) return null;
  const t = Date.parse(`${checkInYmd}T00:00:00.000Z`);
  return Number.isFinite(t) ? new Date(t) : null;
}

function hoursUntilCheckIn(checkInYmd, now) {
  const start = checkInUtcDate(checkInYmd);
  if (!start) return null;
  return (start.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function todayUtcYmd(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Central gate for cancel / modify / resend.
 *
 * @param {object} booking — must include status, checkIn, checkOut; optional modificationCount
 * @param {object|null} property — optional; uses defaults when null
 * @param {BookingPolicyAction} action
 * @param {Date} [now]
 * @param {{ actor?: BookingPolicyActor }} [opts]
 * @returns {{
 *   allowed: boolean,
 *   code?: string,
 *   reason?: string,
 *   refundEligible?: boolean,
 *   hoursUntilCheckIn?: number|null,
 *   policy: object,
 * }}
 */
export function evaluateBookingPolicy(
  booking,
  property,
  action,
  now = new Date(),
  { actor = "guest" } = {},
) {
  const policy = resolveBookingPolicy(property);
  const hours = hoursUntilCheckIn(booking?.checkIn, now);
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
    if (booking.status !== "confirmed") {
      return {
        ...base,
        allowed: false,
        code: "not_confirmed",
        reason: "Only confirmed bookings can resend confirmation emails",
      };
    }
    // Host / admin / guest ownership is enforced by the route — policy allows.
    return { ...base, allowed: true, code: "ok" };
  }

  // Past check-out: no cancel/modify for anyone via self-service.
  const today = todayUtcYmd(now);
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

  // Guest actor
  if (action === "cancel") {
    if (!policy.allowGuestCancel) {
      return {
        ...base,
        allowed: false,
        code: "guest_cancel_disabled",
        reason: "This listing does not allow guest cancellations",
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
    const mods = Number(booking.modificationCount) || 0;
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
  const p = { ...DEFAULT_BOOKING_POLICY, ...policy };
  const parts = [];
  if (p.allowGuestCancel) {
    parts.push(
      `Free cancellation until ${p.freeCancelUntilHoursBeforeCheckIn} hours before check-in`,
    );
  } else {
    parts.push("Guest cancellation is not available");
  }
  if (p.allowGuestModify) {
    parts.push(
      `Date changes until ${p.modifyUntilHoursBeforeCheckIn} hours before check-in (max ${p.maxModifications})`,
    );
  }
  return parts.join(". ") + ".";
}
