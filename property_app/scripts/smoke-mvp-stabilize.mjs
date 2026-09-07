/**
 * Focused smoke checks for MVP stabilize helpers (no DB).
 * Run: node scripts/smoke-mvp-stabilize.mjs
 */
import assert from "node:assert/strict";
import {
  approvedListingQuery,
  canUserViewListing,
  isAwaitingListingModeration,
  isPubliclyVisibleListing,
  pendingModerationQueueQuery,
  publicListingQuery,
  withApprovedListingFilter,
} from "../utils/listingApproval.js";

function buildUpsertOperators({ hostBlocks, defaultAvailability, customDayRates, hostId }) {
  const $set = {};
  const $setOnInsert = { propertyId: "oid" };
  if (hostId) $set.hostId = hostId;
  if (hostBlocks !== undefined) $set.hostBlocks = hostBlocks;
  else $setOnInsert.hostBlocks = [];
  if (defaultAvailability !== undefined) $set.defaultAvailability = defaultAvailability;
  else $setOnInsert.defaultAvailability = "open";
  if (customDayRates !== undefined) $set.customDayRates = customDayRates;
  else $setOnInsert.customDayRates = [];
  return { $set, $setOnInsert };
}

function assertNoPathConflict($set, $setOnInsert) {
  for (const key of Object.keys($set)) {
    assert.equal(
      Object.prototype.hasOwnProperty.call($setOnInsert, key),
      false,
      `path conflict on "${key}"`,
    );
  }
}

// --- listing approval ---
assert.equal(
  isAwaitingListingModeration({ status: "pending", listingModerationRequestedAt: new Date() }),
  true,
);
assert.equal(isAwaitingListingModeration({ status: "pending" }), false);
assert.equal(isPubliclyVisibleListing({}), true);
assert.equal(
  isPubliclyVisibleListing({
    status: "pending",
    listingModerationRequestedAt: new Date(),
  }),
  false,
);
assert.equal(isPubliclyVisibleListing({ status: "rejected" }), false);
assert.equal(isPubliclyVisibleListing({ status: "approved" }), true);
assert.equal(isPubliclyVisibleListing({ status: "approved", listed: false }), false);
assert.ok(publicListingQuery().$and);

assert.equal(
  canUserViewListing(
    { status: "pending", listingModerationRequestedAt: new Date(), owner: "h1" },
    { user: { id: "h1", role: "host" } },
  ),
  true,
);
assert.equal(
  canUserViewListing(
    { status: "pending", listingModerationRequestedAt: new Date(), owner: "h1" },
    { user: { id: "g1", role: "guest" } },
  ),
  false,
);
assert.equal(
  canUserViewListing(
    { status: "pending", listingModerationRequestedAt: new Date(), owner: "h1" },
    { user: { id: "a1", role: "admin" } },
  ),
  true,
);

assert.ok(pendingModerationQueueQuery().status === "pending");
assert.ok(Array.isArray(approvedListingQuery().$or));
assert.ok(withApprovedListingFilter({ type: "Apartment" }).$and);

// --- availability upsert path safety ---
const typicalPut = buildUpsertOperators({
  hostId: "host1",
  hostBlocks: [{ startDate: "2026-09-01", endDate: "2026-09-03" }],
  defaultAvailability: "open",
  customDayRates: [],
});
assertNoPathConflict(typicalPut.$set, typicalPut.$setOnInsert);
assert.deepEqual(Object.keys(typicalPut.$setOnInsert).sort(), ["propertyId"]);

const insertOnly = buildUpsertOperators({});
assertNoPathConflict(insertOnly.$set, insertOnly.$setOnInsert);
assert.ok(insertOnly.$setOnInsert.hostBlocks);
assert.ok(insertOnly.$setOnInsert.defaultAvailability);

console.log("smoke-mvp-stabilize: all checks passed");
