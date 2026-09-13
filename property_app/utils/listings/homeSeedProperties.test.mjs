import test from "node:test";
import assert from "node:assert/strict";
import { toHomeSeedCard } from "./homeSeedCard.js";

test("toHomeSeedCard keeps lean card fields and finite coords", () => {
  const card = toHomeSeedCard({
    _id: "abc123",
    slug: "villa-dakar",
    name: "Villa Dakar",
    type: "Villa",
    beds: 3,
    baths: 2,
    square_feet: 1200,
    listingPrice: 95,
    rates: { nightly: 90, weekly: 500, monthly: 1800 },
    images: [{ url: "https://example.com/a.jpg" }],
    location: {
      city: "Dakar",
      state: "Dakar",
      country: "Senegal",
      lat: 14.7,
      lng: -17.4,
    },
    is_featured: true,
    previewLocked: false,
    seller_info: { name: "Host", email: "h@example.com" },
    description: "should be dropped",
  });

  assert.equal(card._id, "abc123");
  assert.equal(card.id, "abc123");
  assert.equal(card.slug, "villa-dakar");
  assert.equal(card.name, "Villa Dakar");
  assert.equal(card.listingPrice, 95);
  assert.equal(card.rates.nightly, 95);
  assert.equal(card.location.lat, 14.7);
  assert.equal(card.location.lng, -17.4);
  assert.equal(card.description, undefined);
  assert.equal(card.seller_info, undefined);
});

test("toHomeSeedCard keeps catalogue rows without coordinates", () => {
  const card = toHomeSeedCard({
    _id: "x",
    name: "No coords",
    location: { city: "Accra", country: "Ghana" },
  });
  assert.equal(card._id, "x");
  assert.equal(card.location.city, "Accra");
  assert.equal(card.location.lat, null);
  assert.equal(card.location.lng, null);
});

test("toHomeSeedCard falls back to rates.nightly", () => {
  const card = toHomeSeedCard({
    _id: "z",
    name: "Rate only",
    rates: { nightly: 40 },
    location: { lat: 1, lng: 2, city: "Cairo", country: "Egypt" },
  });
  assert.equal(card.listingPrice, 40);
  assert.equal(card.rates.nightly, 40);
});

test("toHomeSeedCard returns null without id", () => {
  assert.equal(toHomeSeedCard({ name: "orphan" }), null);
  assert.equal(toHomeSeedCard(null), null);
});
