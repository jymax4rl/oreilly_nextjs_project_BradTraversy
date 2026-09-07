/**
 * UTC date-range helpers for ops analytics.
 * `to` is exclusive. Comparison window is the equal-length period immediately before `from`.
 */

export const ANALYTICS_PRESETS = Object.freeze([
  { id: "today", label: "Today" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_30", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "last_6_months", label: "Last 6 months" },
  { id: "this_year", label: "This year" },
  { id: "all_time", label: "All time" },
  { id: "custom", label: "Custom range" },
]);

export const GRANULARITIES = Object.freeze(["day", "week", "month"]);

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(input = new Date()) {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addUtcDays(input, days) {
  const d = new Date(input);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d;
}

export function addUtcMonths(input, months) {
  const d = new Date(input);
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  return d;
}

export function parseIsoDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isoDay(input) {
  return startOfUtcDay(input).toISOString().slice(0, 10);
}

export function defaultGranularity(from, to) {
  const days = Math.max(1, (to.getTime() - from.getTime()) / DAY_MS);
  if (days <= 45) return "day";
  if (days <= 210) return "week";
  return "month";
}

function thisMonthStart(now) {
  const d = startOfUtcDay(now);
  d.setUTCDate(1);
  return d;
}

/**
 * @returns {{
 *   preset: string,
 *   from: Date,
 *   to: Date,
 *   previousFrom: Date | null,
 *   previousTo: Date | null,
 *   compare: boolean,
 *   granularity: "day" | "week" | "month",
 *   label: string,
 *   previousLabel: string | null,
 * }}
 */
export function resolveAnalyticsRange({
  preset = "last_30",
  from: fromRaw,
  to: toRaw,
  granularity: granRaw,
  now = new Date(),
} = {}) {
  const today = startOfUtcDay(now);
  const tomorrow = addUtcDays(today, 1);
  let from;
  let to = tomorrow;
  let id = String(preset || "last_30");

  if (id === "custom") {
    from = parseIsoDay(fromRaw);
    const toDay = parseIsoDay(toRaw);
    if (!from || !toDay || toDay < from) {
      id = "last_30";
    } else {
      to = addUtcDays(toDay, 1);
    }
  }

  if (id !== "custom") {
    switch (id) {
      case "today":
        from = today;
        break;
      case "last_7":
        from = addUtcDays(today, -6);
        break;
      case "last_30":
        from = addUtcDays(today, -29);
        break;
      case "this_month":
        from = thisMonthStart(now);
        break;
      case "last_month": {
        const startThis = thisMonthStart(now);
        from = addUtcMonths(startThis, -1);
        to = startThis;
        break;
      }
      case "last_3_months":
        from = addUtcMonths(thisMonthStart(now), -2);
        break;
      case "last_6_months":
        from = addUtcMonths(thisMonthStart(now), -5);
        break;
      case "this_year":
        from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        break;
      case "all_time":
        from = new Date("2015-01-01T00:00:00.000Z");
        break;
      default:
        id = "last_30";
        from = addUtcDays(today, -29);
    }
  }

  const compare = id !== "all_time";
  const duration = to.getTime() - from.getTime();
  const previousTo = compare ? new Date(from) : null;
  const previousFrom = compare ? new Date(from.getTime() - duration) : null;

  let granularity = GRANULARITIES.includes(granRaw)
    ? granRaw
    : defaultGranularity(from, to);

  const spanDays = Math.max(1, (to.getTime() - from.getTime()) / DAY_MS);
  if (granularity === "day" && spanDays > 400) granularity = "week";
  if (granularity === "week" && spanDays > 900) granularity = "month";

  return {
    preset: id,
    from,
    to,
    previousFrom,
    previousTo,
    compare,
    granularity,
    label: formatRangeLabel(from, to),
    previousLabel:
      previousFrom && previousTo
        ? formatRangeLabel(previousFrom, previousTo)
        : null,
  };
}

export function formatRangeLabel(from, toExclusive) {
  const last = addUtcDays(toExclusive, -1);
  const a = from.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const b = last.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return a === b ? a : `${a} – ${b}`;
}

export function percentChange(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) {
    if (c === 0) return 0;
    return null;
  }
  return Math.round(((c - p) / p) * 1000) / 10;
}

export function fillTimeBuckets(rows, from, to, unit, valueKey = "count") {
  const map = new Map(
    rows.map((row) => {
      const t = row._id instanceof Date ? row._id.toISOString() : new Date(row._id).toISOString();
      return [t, Number(row[valueKey]) || 0];
    }),
  );
  const out = [];
  let cursor = new Date(from);
  const end = new Date(to);
  while (cursor < end) {
    const key = cursor.toISOString();
    out.push({ t: key, value: map.get(key) || 0 });
    if (unit === "day") cursor = addUtcDays(cursor, 1);
    else if (unit === "week") cursor = addUtcDays(cursor, 7);
    else cursor = addUtcMonths(cursor, 1);
  }
  return out;
}
