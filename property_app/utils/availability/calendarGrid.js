import { formatDateOnly, parseDateOnly } from "@/utils/availability/dateUtils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export { WEEKDAYS };

export function getMonthLabel(year, month) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** @returns {{ date: string, inMonth: boolean }[]} */
export function buildMonthGrid(year, month) {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate();

  const cells = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({
      date: formatDateOnly(Date.UTC(prevYear, prevMonth, d)),
      inMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: formatDateOnly(Date.UTC(year, month, d)),
      inMonth: true,
    });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let d = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: formatDateOnly(Date.UTC(nextYear, nextMonth, d)),
      inMonth: false,
    });
    d += 1;
  }

  return cells;
}

export function isDateInRange(dateStr, startDate, endDate) {
  const t = parseDateOnly(dateStr);
  const s = parseDateOnly(startDate);
  const e = parseDateOnly(endDate);
  if (t == null || s == null || e == null) return false;
  return t >= s && t < e;
}

export function getDayStatus(dateStr, { hostBlocks = [], unavailableRanges = [] }) {
  for (const r of unavailableRanges) {
    if (isDateInRange(dateStr, r.startDate, r.endDate)) {
      return r.source === "booking" ? "booked" : "blocked";
    }
  }
  for (const b of hostBlocks) {
    if (isDateInRange(dateStr, b.startDate, b.endDate)) {
      return "blocked";
    }
  }
  return "available";
}

export function isToday(dateStr) {
  const now = new Date();
  const today = formatDateOnly(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return dateStr === today;
}

export function isPast(dateStr) {
  const t = parseDateOnly(dateStr);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return t != null && t < today;
}

export function normalizeSelection(start, end) {
  if (!start || !end) return { startDate: start, endDate: end };
  const a = parseDateOnly(start);
  const b = parseDateOnly(end);
  if (a == null || b == null) return { startDate: start, endDate: end };
  if (a <= b) return { startDate: start, endDate: end };
  return { startDate: end, endDate: start };
}

/** Add days to YYYY-MM-DD (UTC). */
export function addDays(dateStr, days) {
  const t = parseDateOnly(dateStr);
  if (t == null) return dateStr;
  return formatDateOnly(t + days * 24 * 60 * 60 * 1000);
}
