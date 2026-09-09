/**
 * Viewport bounds helpers for map catalog queries (no DB / path aliases).
 */

export function parseOptionalNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Validate and normalize a map viewport. Rejects absurdly large boxes.
 * @returns {{ north:number, south:number, east:number, west:number }|null}
 */
export function parseMapBounds({ north, south, east, west } = {}) {
  const n = parseOptionalNumber(north);
  const s = parseOptionalNumber(south);
  const e = parseOptionalNumber(east);
  const w = parseOptionalNumber(west);

  if (
    n == null ||
    s == null ||
    e == null ||
    w == null ||
    n === s ||
    Math.abs(n) > 90 ||
    Math.abs(s) > 90 ||
    Math.abs(e) > 180 ||
    Math.abs(w) > 180
  ) {
    return null;
  }

  const latSpan = Math.abs(n - s);
  const lngSpan = w <= e ? e - w : 360 - (w - e);
  if (latSpan > 80 || lngSpan > 120) return null;

  return { north: n, south: s, east: e, west: w };
}

/**
 * Apply numeric lat/lng bounds onto a Mongo query object (mutates + returns).
 */
export function applyLatLngBounds(mongoQuery, bounds) {
  if (!bounds) return mongoQuery;
  const { north, south, east, west } = bounds;
  mongoQuery["location.lat"] = {
    ...(mongoQuery["location.lat"] || {}),
    $type: "number",
    $gte: Math.min(south, north),
    $lte: Math.max(south, north),
  };
  mongoQuery["location.lng"] = {
    ...(mongoQuery["location.lng"] || {}),
    $type: "number",
  };

  if (west <= east) {
    mongoQuery["location.lng"].$gte = west;
    mongoQuery["location.lng"].$lte = east;
  } else {
    mongoQuery.$and = mongoQuery.$and || [];
    mongoQuery.$and.push({
      $or: [
        { "location.lng": { $gte: west, $lte: 180 } },
        { "location.lng": { $gte: -180, $lte: east } },
      ],
    });
  }
  return mongoQuery;
}
