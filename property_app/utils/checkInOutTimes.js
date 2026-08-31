/** Default guest arrival / departure clock times (property-local, HH:mm). */
export const DEFAULT_CHECK_IN_TIME = "15:00";
export const DEFAULT_CHECK_OUT_TIME = "11:00";

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Normalize a clock time to "HH:mm". Accepts "15:00", "15:00:00", or "3:00 PM".
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
export function normalizeClockTime(value, fallback) {
  if (value == null) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;

  const twentyFour = raw.match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/);
  if (twentyFour) {
    const h = Number(twentyFour[1]);
    const m = twentyFour[2];
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, "0")}:${m}`;
    }
  }

  const twelve = raw.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (twelve) {
    let h = Number(twelve[1]);
    const m = twelve[2];
    const ap = twelve[3].toUpperCase();
    if (h >= 1 && h <= 12) {
      if (ap === "AM") h = h === 12 ? 0 : h;
      else h = h === 12 ? 12 : h + 12;
      return `${String(h).padStart(2, "0")}:${m}`;
    }
  }

  return fallback;
}

/**
 * Format HH:mm for guests (e.g. "3:00 PM"). Falls back to raw if invalid.
 * @param {unknown} value
 * @param {string} [fallback]
 */
export function formatClockTimeLabel(value, fallback = "") {
  const normalized =
    normalizeClockTime(value, "") ||
    normalizeClockTime(fallback, "");
  if (!normalized || !HH_MM.test(normalized)) {
    return fallback || (value ? String(value) : "");
  }
  const [hs, ms] = normalized.split(":");
  let h = Number(hs);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${ms} ${suffix}`;
}
