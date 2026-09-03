/**
 * Floor a date to a UTC 15-minute bucket id (ISO string).
 */
export function trafficBucketId(date = new Date()) {
  const d = new Date(date);
  const mins = Math.floor(d.getUTCMinutes() / 15) * 15;
  d.setUTCMinutes(mins, 0, 0);
  return d.toISOString();
}

export const BUCKET_MS = 15 * 60 * 1000;
export const SERIES_HOURS = 24;
export const SERIES_POINTS = (SERIES_HOURS * 60) / 15;
export const BUCKET_TTL_MS = 48 * 60 * 60 * 1000;
