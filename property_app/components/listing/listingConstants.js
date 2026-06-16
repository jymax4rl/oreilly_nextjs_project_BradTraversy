export const LISTING_PROPERTY_TYPES = [
  { id: "House", label: "House" },
  { id: "Apartment", label: "Apartment" },
  { id: "Condo", label: "Condo" },
  { id: "Cabin or Cottage", label: "Cabin" },
  { id: "Room", label: "Room" },
  { id: "Studio", label: "Studio" },
  { id: "Loft", label: "Loft" },
  { id: "Other", label: "Other" },
];

export const PRIVACY_TYPES = [
  {
    id: "entire_place",
    label: "An entire place",
    description: "Guests have the whole place to themselves.",
  },
  {
    id: "private_room",
    label: "A room",
    description:
      "Guests have their own room plus access to shared spaces.",
  },
  {
    id: "shared_room",
    label: "A shared room",
    description: "Guests sleep in a room shared with others.",
  },
];

export const LISTING_AMENITIES = [
  "Wifi",
  "TV",
  "Kitchen",
  "Washer",
  "Free parking on premises",
  "Air conditioning",
  "Dedicated workspace",
  "Pool",
  "Hot tub",
  "Patio",
  "BBQ grill",
  "Breakfast",
  "Gym",
  "Elevator",
  "24/7 Security",
];

export const WIZARD_STEPS = [
  { id: "intro", label: "Start" },
  { id: "type", label: "Type" },
  { id: "privacy", label: "Privacy" },
  { id: "location", label: "Location" },
  { id: "pin", label: "Map pin" },
  { id: "basics", label: "Basics" },
  { id: "amenities", label: "Amenities" },
  { id: "photos", label: "Photos" },
  { id: "title", label: "Title" },
  { id: "pricing", label: "Pricing" },
  { id: "publish", label: "Publish" },
];

export function emptyListingState() {
  return {
    type: "",
    listing: {
      privacyType: "",
      maxGuests: 2,
      bedroomHasLock: false,
    },
    name: "",
    description: "",
    location: {
      formatted: "",
      street: "",
      streetLine2: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      countryCode: "",
      placeId: "",
      lat: null,
      lng: null,
      showExactLocation: false,
    },
    beds: 1,
    baths: 1,
    square_feet: 500,
    amenities: [],
    rates: {
      nightly: 50,
      weekly: "",
      monthly: "",
      weekendPremium: 0,
    },
    seller_info: {
      name: "",
      email: "",
      phone: "",
    },
    images: [],
  };
}
