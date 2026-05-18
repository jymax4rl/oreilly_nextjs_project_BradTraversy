import { formatDateOnly, parseDateOnly } from "@/utils/availability/dateUtils";
import {
  getDayStatus,
  isPast,
  normalizeSelection,
} from "@/utils/availability/calendarGrid";

/**
 * Validate guest stay (checkIn inclusive, checkOut exclusive).
 * @returns {{ ok: boolean, checkIn?: string, checkOut?: string, error?: string }}
 */
export function validateStayDates(checkIn, checkOut, unavailableRanges = []) {
  if (!checkIn || !checkOut) {
    return { ok: false, error: "Select check-in and check-out dates" };
  }

  const norm = normalizeSelection(checkIn, checkOut);
  const start = parseDateOnly(norm.startDate);
  const end = parseDateOnly(norm.endDate);

  if (start == null || end == null) {
    return { ok: false, error: "Invalid dates" };
  }

  if (start >= end) {
    return { ok: false, error: "Check-out must be after check-in" };
  }

  let t = start;
  while (t < end) {
    const dateStr = formatDateOnly(t);
    if (isPast(dateStr)) {
      return { ok: false, error: "Cannot book dates in the past" };
    }
    const status = getDayStatus(dateStr, { unavailableRanges });
    if (status !== "available") {
      return {
        ok: false,
        error:
          status === "booked"
            ? "Some nights in your stay are already booked"
            : "Some nights in your stay are unavailable",
      };
    }
    t += 24 * 60 * 60 * 1000;
  }

  return {
    ok: true,
    checkIn: norm.startDate,
    checkOut: norm.endDate,
  };
}

export function countNights(checkIn, checkOut) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (start == null || end == null || end <= start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

export function formatGuestDate(dateStr) {
  if (!dateStr) return null;
  const t = parseDateOnly(dateStr);
  if (t == null) return dateStr;
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });
}
