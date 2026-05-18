const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD to UTC midnight timestamp for comparison. */
export function parseDateOnly(value) {
  if (!value || !DATE_ONLY.test(value)) {
    return null;
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

export function isValidDateOnly(value) {
  return parseDateOnly(value) !== null;
}

/** @param {number} ts UTC midnight ms */
export function formatDateOnly(ts) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Ranges overlap when both use [start, end) semantics.
 * @param {{ startDate: string, endDate: string }} a
 * @param {{ startDate: string, endDate: string }} b
 */
export function rangesOverlap(a, b) {
  const aStart = parseDateOnly(a.startDate);
  const aEnd = parseDateOnly(a.endDate);
  const bStart = parseDateOnly(b.startDate);
  const bEnd = parseDateOnly(b.endDate);
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) {
    return false;
  }
  if (aStart >= aEnd || bStart >= bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * @param {{ startDate: string, endDate: string, source?: string, note?: string }} range
 */
export function validateRange(range) {
  const errors = [];
  if (!isValidDateOnly(range.startDate)) {
    errors.push("Invalid startDate (use YYYY-MM-DD)");
  }
  if (!isValidDateOnly(range.endDate)) {
    errors.push("Invalid endDate (use YYYY-MM-DD)");
  }
  const start = parseDateOnly(range.startDate);
  const end = parseDateOnly(range.endDate);
  if (start != null && end != null && start >= end) {
    errors.push("endDate must be after startDate");
  }
  if (start != null && end != null) {
    const maxNights = 366;
    const nights = (end - start) / (24 * 60 * 60 * 1000);
    if (nights > maxNights) {
      errors.push(`Range cannot exceed ${maxNights} days`);
    }
  }
  return errors;
}

/**
 * Merge overlapping/adjacent ranges (same source not required).
 * @param {Array<{ startDate: string, endDate: string, source?: string }>} ranges
 */
export function mergeRanges(ranges) {
  const valid = ranges
    .filter((r) => isValidDateOnly(r.startDate) && isValidDateOnly(r.endDate))
    .map((r) => ({
      start: parseDateOnly(r.startDate),
      end: parseDateOnly(r.endDate),
      source: r.source,
    }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start);

  if (valid.length === 0) return [];

  const merged = [{ ...valid[0] }];
  for (let i = 1; i < valid.length; i++) {
    const cur = valid[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
      if (last.source !== cur.source) last.source = "mixed";
    } else {
      merged.push({ ...cur });
    }
  }

  return merged.map((r) => ({
    startDate: formatDateOnly(r.start),
    endDate: formatDateOnly(r.end),
    source: r.source,
  }));
}
