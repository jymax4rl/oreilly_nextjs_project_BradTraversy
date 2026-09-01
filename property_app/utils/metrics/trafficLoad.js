/** Planning target discussed for marketplace browsing capacity. */
export const DAILY_VISITOR_TARGET = 3000;

const ACTIVE_NOW_BUSY = 150;
const ACTIVE_NOW_HOT = 500;

/**
 * Map live concurrency + daily unique visitors onto a scannable ops load band.
 * Heartbeats in the last 5 minutes ≈ people with the site open, not peak RPS.
 */
export function describeTrafficLoad({ activeNow, visitorsToday }) {
  const active = Number(activeNow) || 0;
  const today = Number(visitorsToday) || 0;
  const ofTarget = today / DAILY_VISITOR_TARGET;

  if (active >= ACTIVE_NOW_HOT || ofTarget >= 1) {
    return {
      id: "hot",
      label: "Hot",
      hint: "Live traffic is at or past the 3,000-visitor planning target — watch Mongo latency.",
    };
  }
  if (active >= ACTIVE_NOW_BUSY || ofTarget >= 0.5) {
    return {
      id: "busy",
      label: "Busy",
      hint: "Healthy marketplace load. Listing pages are hitting Mongo on each request.",
    };
  }
  if (active > 0 || today > 0) {
    return {
      id: "comfortable",
      label: "Comfortable",
      hint: "Well under the 3,000 daily-visitor planning target.",
    };
  }
  return {
    id: "quiet",
    label: "Quiet",
    hint: "No anonymous probes in this window yet (opens after the first guest page load).",
  };
}
