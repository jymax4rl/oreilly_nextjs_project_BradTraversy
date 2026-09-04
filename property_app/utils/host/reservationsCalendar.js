import { formatDateOnly, parseDateOnly } from "@/utils/availability/dateUtils";
import { countNights } from "@/utils/availability/validateStay";

const DAY_MS = 24 * 60 * 60 * 1000;

export function localTodayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd, days) {
  const t = parseDateOnly(ymd);
  if (t == null) return ymd;
  return formatDateOnly(t + days * DAY_MS);
}

export function startOfWeekMonday(ymd) {
  const t = parseDateOnly(ymd);
  if (t == null) return ymd;
  const day = new Date(t).getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return formatDateOnly(t + diff * DAY_MS);
}

export function startOfMonth(ymd) {
  const [y, m] = ymd.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonth(ymd) {
  const [y, m] = ymd.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function eachDayInclusive(from, to) {
  const start = parseDateOnly(from);
  const end = parseDateOnly(to);
  if (start == null || end == null || end < start) return [];
  const days = [];
  for (let t = start; t <= end; t += DAY_MS) {
    days.push(formatDateOnly(t));
  }
  return days;
}

export function rangeForView(view, anchorYmd) {
  const today = localTodayYmd();
  const anchor = anchorYmd || today;
  if (view === "week") {
    const from = startOfWeekMonday(anchor);
    return { from, to: addDaysYmd(from, 6) };
  }
  if (view === "month") {
    return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
  }
  return { from: addDaysYmd(anchor, -3), to: addDaysYmd(anchor, 24) };
}

export function shiftRange(from, to, view, direction) {
  const days = eachDayInclusive(from, to).length || 1;
  const delta = direction * (view === "month" ? days : days);
  return { from: addDaysYmd(from, delta), to: addDaysYmd(to, delta) };
}

export function monthPreset(which) {
  const today = localTodayYmd();
  if (which === "next") {
    const next = addDaysYmd(endOfMonth(today), 1);
    return { from: startOfMonth(next), to: endOfMonth(next) };
  }
  return { from: startOfMonth(today), to: endOfMonth(today) };
}

export function weekPreset() {
  const from = startOfWeekMonday(localTodayYmd());
  return { from, to: addDaysYmd(from, 6) };
}

export function displayStatus(booking, todayYmd) {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.listed === false) return "unlisted";
  if (booking.status === "pending") return "pending";
  if (booking.status === "confirmed" && booking.checkOut <= todayYmd) {
    return "completed";
  }
  return booking.status === "confirmed" ? "confirmed" : booking.status;
}

export function isStayModified(booking) {
  return (
    (Number(booking.modificationCount) || 0) > 0 ||
    Boolean(booking.previousCheckIn) ||
    Boolean(booking.previousPropertyId)
  );
}

/** Color + chip on the stay pill. More specific than filter status. */
export function pillStatus(booking, todayYmd) {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.listed === false) return "unlisted";
  if (booking.status === "pending") return "pending";
  if (booking.checkOut <= todayYmd) return "past";
  if (booking.checkIn <= todayYmd) return "current";
  if (isStayModified(booking)) return "modified";
  return "upcoming";
}

export function firstName(full) {
  const name = String(full || "").trim();
  if (!name) return "";
  return name.split(/\s+/)[0];
}

export function initials(full) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Greedy lanes so overlapping stays on one property never share a row.
 * Checkout is exclusive, so a stay ending on D can share a lane with one starting on D.
 */
export function assignLanes(bookings) {
  const sorted = [...bookings].sort((a, b) => {
    const c = String(a.checkIn).localeCompare(String(b.checkIn));
    if (c !== 0) return c;
    return String(a.checkOut).localeCompare(String(b.checkOut));
  });
  const laneEnds = [];
  return sorted.map((booking) => {
    let lane = laneEnds.findIndex((end) => end <= booking.checkIn);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(booking.checkOut);
    } else {
      laneEnds[lane] = booking.checkOut;
    }
    return { ...booking, lane };
  });
}

export function barGeometry(booking, days, dayPx) {
  const index = Object.fromEntries(days.map((d, i) => [d, i]));
  const last = days[days.length - 1];
  const first = days[0];
  if (!first || !last) return null;
  const start = booking.checkIn < first ? first : booking.checkIn;
  const endExclusive = booking.checkOut > addDaysYmd(last, 1)
    ? addDaysYmd(last, 1)
    : booking.checkOut;
  const startIdx = index[start];
  const endIdx = index[endExclusive] ?? days.length;
  if (startIdx == null || endIdx <= startIdx) {
    const fallback = index[booking.checkIn];
    if (fallback == null) return null;
    return { left: fallback * dayPx, width: dayPx, clipped: true };
  }
  return {
    left: startIdx * dayPx,
    width: Math.max(dayPx * 0.72, (endIdx - startIdx) * dayPx),
    clipped: booking.checkIn < first || booking.checkOut > addDaysYmd(last, 1),
  };
}

export function formatRangeLabel(from, to, locale = "en") {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const start = parseDateOnly(from);
  const end = parseDateOnly(to);
  if (start == null || end == null) return `${from} – ${to}`;
  const a = new Date(start);
  const b = new Date(end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();
  const showYear = !sameYear || a.getUTCFullYear() !== new Date().getFullYear();

  if (sameMonth) {
    const month = a.toLocaleDateString(loc, { month: "short", timeZone: "UTC" });
    const d1 = a.toLocaleDateString(loc, { day: "numeric", timeZone: "UTC" });
    const d2 = b.toLocaleDateString(loc, { day: "numeric", timeZone: "UTC" });
    const year = showYear ? ` ${a.getUTCFullYear()}` : "";
    if (locale === "fr") return `${d1} – ${d2} ${month}${year}`;
    return `${month} ${d1} – ${d2}${year}`;
  }

  const opts = {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(showYear ? { year: "numeric" } : {}),
  };
  return `${a.toLocaleDateString(loc, opts)} – ${b.toLocaleDateString(loc, opts)}`;
}

export function formatDayHead(ymd, locale = "en") {
  const t = parseDateOnly(ymd);
  if (t == null) return { num: ymd, wk: "" };
  const d = new Date(t);
  return {
    num: d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      timeZone: "UTC",
    }),
    mon: d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      month: "short",
      timeZone: "UTC",
    }),
    wk: d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "short",
      timeZone: "UTC",
    }),
  };
}

export { countNights };
