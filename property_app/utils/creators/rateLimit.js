const buckets = new Map();

function prune(now) {
  if (buckets.size < 400) return;
  for (const [key, times] of buckets) {
    const kept = times.filter((t) => now - t < 60 * 60 * 1000);
    if (kept.length === 0) buckets.delete(key);
    else buckets.set(key, kept);
  }
}

/**
 * Sliding window. Returns true when the request is allowed.
 */
export function allowCreatorHit(key, { limit, windowMs }) {
  const now = Date.now();
  prune(now);
  const id = String(key || "unknown").slice(0, 180);
  const recent = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  buckets.set(id, recent);
  return true;
}

export function creatorLeadRateOk(ip, email) {
  const hour = 60 * 60 * 1000;
  if (!allowCreatorHit(`ip:${ip}`, { limit: 8, windowMs: hour })) return false;
  if (!allowCreatorHit(`email:${email}`, { limit: 4, windowMs: hour })) {
    return false;
  }
  return true;
}

export function creatorEventRateOk(ip) {
  return allowCreatorHit(`evt:${ip}`, {
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });
}
