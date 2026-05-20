import { parseDateOnly, formatDateOnly } from "@/utils/availability/dateUtils";

/** Full refund eligibility window (phase 2 refunds; recorded in MVP). */
export const FREE_CANCEL_DAYS_BEFORE_CHECKIN = 7;

/** Modifications blocked on check-in day and after. */
export const MODIFY_MIN_DAYS_BEFORE_CHECKIN = 1;

export function utcTodayString() {
  const now = new Date();
  return formatDateOnly(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function daysUntilCheckIn(checkIn, today = utcTodayString()) {
  const checkInTs = parseDateOnly(checkIn);
  const todayTs = parseDateOnly(today);
  if (checkInTs == null || todayTs == null) return null;
  return Math.round((checkInTs - todayTs) / (24 * 60 * 60 * 1000));
}

export function isCheckInInPast(checkIn, today = utcTodayString()) {
  const days = daysUntilCheckIn(checkIn, today);
  return days != null && days < 0;
}

export function canModifyBooking(booking, today = utcTodayString()) {
  if (!booking) {
    return { ok: false, reason: "Booking not found" };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, reason: "Only confirmed bookings can be modified" };
  }

  const days = daysUntilCheckIn(booking.checkIn, today);
  if (days == null) {
    return { ok: false, reason: "Invalid stay dates on booking" };
  }
  if (days < 0) {
    return { ok: false, reason: "Cannot modify a stay that has already started" };
  }
  if (days < MODIFY_MIN_DAYS_BEFORE_CHECKIN) {
    return {
      ok: false,
      reason: "Modifications are not allowed on or after check-in day",
    };
  }

  return { ok: true, daysUntilCheckIn: days };
}

export function canCancelBooking(booking, today = utcTodayString()) {
  if (!booking) {
    return { ok: false, reason: "Booking not found" };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, reason: "Only confirmed bookings can be cancelled" };
  }

  if (isCheckInInPast(booking.checkIn, today)) {
    return { ok: false, reason: "Cannot cancel after check-in" };
  }

  const days = daysUntilCheckIn(booking.checkIn, today);
  const refundEligible =
    days != null && days >= FREE_CANCEL_DAYS_BEFORE_CHECKIN;

  return {
    ok: true,
    daysUntilCheckIn: days,
    refundEligible,
    refundLabel: refundEligible
      ? "Eligible for refund per cancellation policy (processing in a future update)."
      : "No refund per cancellation policy (within 7 days of check-in).",
  };
}

export function bookingActionFlags(booking, today = utcTodayString()) {
  const modify = canModifyBooking(booking, today);
  const cancel = canCancelBooking(booking, today);
  return {
    canModify: modify.ok,
    modifyReason: modify.ok ? null : modify.reason,
    canCancel: cancel.ok,
    cancelReason: cancel.ok ? null : cancel.reason,
    refundEligible: cancel.ok ? cancel.refundEligible : false,
    refundLabel: cancel.ok ? cancel.refundLabel : null,
    daysUntilCheckIn: cancel.daysUntilCheckIn ?? modify.daysUntilCheckIn ?? null,
  };
}
