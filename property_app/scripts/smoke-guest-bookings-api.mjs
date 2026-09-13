/**
 * Smoke checks for guest trips list query helper (no DB / mongoose).
 * Run: node scripts/smoke-guest-bookings-api.mjs
 *
 * List items reuse bookingWithPolicyFlags from the detail route — covered there /
 * at runtime. This smoke locks guest scoping + status dialect only.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { buildGuestBookingsQuery } = await import(
  pathToFileURL(path.join(appRoot, "utils/bookings/guestBookingsList.js")).href
);

const GUEST = "507f1f77bcf86cd799439011";
const TODAY = "2026-06-15";

{
  const all = buildGuestBookingsQuery(GUEST, { status: null, today: TODAY });
  assert.equal(all.ok, true);
  assert.equal(all.status, "all");
  assert.deepEqual(all.query.guestId, GUEST);
  assert.deepEqual(all.query.status, {
    $in: ["confirmed", "pending", "cancelled"],
  });
  assert.deepEqual(all.sort, { checkIn: -1 });
}

{
  const upcoming = buildGuestBookingsQuery(GUEST, {
    status: "upcoming",
    today: TODAY,
  });
  assert.equal(upcoming.ok, true);
  assert.deepEqual(upcoming.query.status, { $in: ["confirmed", "pending"] });
  assert.deepEqual(upcoming.query.checkIn, { $gte: TODAY });
}

{
  const past = buildGuestBookingsQuery(GUEST, { status: "past", today: TODAY });
  assert.equal(past.ok, true);
  assert.equal(past.query.status, "confirmed");
  assert.deepEqual(past.query.checkOut, { $lt: TODAY });
}

{
  const active = buildGuestBookingsQuery(GUEST, { status: "active" });
  assert.equal(active.ok, true);
  assert.deepEqual(active.query.status, { $in: ["pending", "confirmed"] });
}

for (const status of ["pending", "confirmed", "cancelled"]) {
  const q = buildGuestBookingsQuery(GUEST, { status });
  assert.equal(q.ok, true);
  assert.equal(q.query.status, status);
}

{
  const bad = buildGuestBookingsQuery(GUEST, { status: "nope" });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /Invalid status/);
}

{
  const empty = buildGuestBookingsQuery("", {});
  assert.equal(empty.ok, false);
}

// Guest scoping: query always pins guestId (never property owner)
{
  const q = buildGuestBookingsQuery(GUEST, { status: "confirmed" });
  assert.equal(q.query.guestId, GUEST);
  assert.equal(q.query.status, "confirmed");
  assert.equal("propertyId" in q.query, false);
}

console.log("smoke-guest-bookings-api: ok");
