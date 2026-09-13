import assert from "node:assert/strict";
import test from "node:test";
import { applyLatLngBounds, parseMapBounds } from "./mapBounds.js";

test("parseMapBounds accepts a city-scale viewport", () => {
  assert.deepEqual(
    parseMapBounds({
      north: "15",
      south: "14",
      east: "-16",
      west: "-18",
    }),
    { north: 15, south: 14, east: -16, west: -18 },
  );
});

test("parseMapBounds rejects whole-world spam", () => {
  assert.equal(
    parseMapBounds({
      north: 90,
      south: -90,
      east: 180,
      west: -180,
    }),
    null,
  );
});

test("applyLatLngBounds sets inclusive lat/lng ranges", () => {
  const q = applyLatLngBounds({}, {
    north: 15,
    south: 14,
    east: -16,
    west: -18,
  });
  assert.equal(q["location.lat"].$gte, 14);
  assert.equal(q["location.lat"].$lte, 15);
  assert.equal(q["location.lng"].$gte, -18);
  assert.equal(q["location.lng"].$lte, -16);
});

test("applyLatLngBounds handles antimeridian wrap", () => {
  const q = applyLatLngBounds({}, {
    north: 10,
    south: 0,
    east: -170,
    west: 170,
  });
  assert.ok(Array.isArray(q.$and));
  assert.ok(q.$and.some((clause) => Array.isArray(clause.$or)));
});
