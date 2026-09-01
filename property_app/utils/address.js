import { loadGoogleMapsApi, importPlacesLibrary } from "@/utils/googleMaps";

/** Fallback centers when Maps/Geocoding is unavailable (manual address path). */
export const DEFAULT_MAP_CENTER = { lat: 6.5244, lng: 3.3792 }; // Lagos

const CITY_CENTERS = {
  lagos: { lat: 6.5244, lng: 3.3792 },
  abuja: { lat: 9.0765, lng: 7.3986 },
  nairobi: { lat: -1.2921, lng: 36.8219 },
  accra: { lat: 5.6037, lng: -0.187 },
  dakar: { lat: 14.7167, lng: -17.4677 },
  bamako: { lat: 12.6392, lng: -8.0029 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  johannesburg: { lat: -26.2041, lng: 28.0473 },
  kigali: { lat: -1.9441, lng: 30.0619 },
  kampala: { lat: 0.3476, lng: 32.5825 },
  "addis ababa": { lat: 9.032, lng: 38.7469 },
  casablanca: { lat: 33.5731, lng: -7.5898 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
};

const COMPONENT_TYPES = {
  streetNumber: "street_number",
  route: "route",
  locality: "locality",
  sublocality: "sublocality",
  adminArea1: "administrative_area_level_1",
  adminArea2: "administrative_area_level_2",
  country: "country",
  postalCode: "postal_code",
};

export const emptyAddress = () => ({
  formatted: "",
  streetLine1: "",
  streetLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  countryCode: "",
  placeId: "",
  lat: null,
  lng: null,
});

function getComponent(components, type) {
  return components.find((c) => (c.types || []).includes(type));
}

function componentLong(c) {
  if (!c) return "";
  return c.longText || c.long_name || "";
}

function componentShort(c) {
  if (!c) return "";
  return c.shortText || c.short_name || "";
}

function readLatLng(location) {
  if (!location) return { lat: null, lng: null };
  const lat =
    typeof location.lat === "function" ? location.lat() : Number(location.lat);
  const lng =
    typeof location.lng === "function" ? location.lng() : Number(location.lng);
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

/**
 * Parse a Google Place into our address shape.
 * Supports Places API (New) Place after fetchFields, and legacy PlaceResult.
 */
export function parseGooglePlace(place) {
  if (!place) return null;

  const components =
    place.addressComponents || place.address_components || [];
  const { lat, lng } = readLatLng(place.location || place.geometry?.location);
  const formatted =
    place.formattedAddress ||
    place.formatted_address ||
    (typeof place.displayName === "string"
      ? place.displayName
      : place.displayName?.text) ||
    "";
  const placeId = place.id || place.place_id || "";

  if (!components.length) {
    if (!formatted && lat == null) return null;
    return {
      formatted,
      streetLine1: formatted.split(",")[0]?.trim() || "",
      streetLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      countryCode: "",
      placeId,
      lat,
      lng,
    };
  }

  const streetNumber = getComponent(components, COMPONENT_TYPES.streetNumber);
  const route = getComponent(components, COMPONENT_TYPES.route);
  const locality =
    getComponent(components, COMPONENT_TYPES.locality) ||
    getComponent(components, COMPONENT_TYPES.sublocality) ||
    getComponent(components, COMPONENT_TYPES.adminArea2);
  const state = getComponent(components, COMPONENT_TYPES.adminArea1);
  const country = getComponent(components, COMPONENT_TYPES.country);
  const postalCode = getComponent(components, COMPONENT_TYPES.postalCode);

  const streetLine1 = [componentLong(streetNumber), componentLong(route)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    formatted: formatted || "",
    streetLine1: streetLine1 || formatted.split(",")[0]?.trim() || "",
    streetLine2: "",
    city: componentLong(locality) || "",
    state: componentShort(state) || componentLong(state) || "",
    postalCode: componentLong(postalCode) || "",
    country: componentLong(country) || "",
    countryCode: componentShort(country) || "",
    placeId,
    lat,
    lng,
  };
}

export function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (address.formatted?.trim()) return address.formatted.trim();

  return [
    address.streetLine1,
    address.streetLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ");
}

export function normalizeAddressInput(input) {
  if (!input) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return {
      ...emptyAddress(),
      formatted: trimmed,
      streetLine1: trimmed,
      city: "—",
      country: "—",
    };
  }

  const streetLine1 = input.streetLine1?.trim();
  const city = input.city?.trim();
  const country = input.country?.trim();

  if (!streetLine1 || !city || !country) {
    return null;
  }

  const normalized = {
    ...emptyAddress(),
    ...input,
    streetLine1,
    city,
    country,
    streetLine2: input.streetLine2?.trim() || "",
    state: input.state?.trim() || "",
    postalCode: input.postalCode?.trim() || "",
    countryCode: input.countryCode?.trim()?.toUpperCase() || "",
    placeId: input.placeId?.trim() || "",
    formatted:
      input.formatted?.trim() ||
      formatAddress({ ...input, streetLine1, city, country }),
    lat:
      typeof input.lat === "number" && !Number.isNaN(input.lat)
        ? input.lat
        : null,
    lng:
      typeof input.lng === "number" && !Number.isNaN(input.lng)
        ? input.lng
        : null,
  };

  return normalized;
}

/**
 * Coerce a Mongo-stored address (legacy string or partial object) into
 * AddressSchema shape so Mongoose can save nested `address` / `hostAddress`.
 */
export function coerceStoredAddress(value) {
  const normalized = normalizeAddressInput(value);
  if (normalized) return normalized;

  const fromLegacy = addressFromLegacy(value);
  if (!fromLegacy.streetLine1?.trim() && !fromLegacy.formatted?.trim()) {
    return null;
  }

  return {
    ...fromLegacy,
    streetLine1: fromLegacy.streetLine1 || fromLegacy.formatted,
    city: fromLegacy.city || "—",
    country: fromLegacy.country || "—",
  };
}

export function addressFromLegacy(value) {
  if (!value) return emptyAddress();
  if (typeof value === "object" && value.streetLine1) {
    return { ...emptyAddress(), ...value };
  }
  if (typeof value === "string") {
    return {
      ...emptyAddress(),
      formatted: value,
      streetLine1: value,
      city: "",
      country: "",
    };
  }
  return emptyAddress();
}

export function isAddressComplete(address) {
  const normalized = normalizeAddressInput(address);
  return Boolean(
    normalized?.streetLine1 && normalized?.city && normalized?.country,
  );
}

/** Coerce stored / form lat or lng to a finite number, or null. */
export function coerceCoordinate(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** @deprecated Use loadGoogleMapsApi from @/utils/googleMaps */
export function loadGoogleMapsPlaces() {
  return loadGoogleMapsApi(["places"]);
}

function lookupCityCenter(city, country) {
  const cityKey = String(city || "")
    .trim()
    .toLowerCase();
  if (cityKey && CITY_CENTERS[cityKey]) {
    return { ...CITY_CENTERS[cityKey], source: "city_table" };
  }

  const haystack = `${city || ""} ${country || ""}`.toLowerCase();
  for (const [name, coords] of Object.entries(CITY_CENTERS)) {
    if (haystack.includes(name)) {
      return { ...coords, source: "city_table" };
    }
  }
  return null;
}

/**
 * Resolve lat/lng via Places API (New) AutocompleteSuggestion — never legacy
 * Autocomplete / PlacesService. Falls through to city-table / Lagos soft pin.
 */
async function geocodeWithPlacesNew(query) {
  if (!query || typeof window === "undefined") return null;

  try {
    const google = await loadGoogleMapsApi(["places"]);
    const placesLib = await importPlacesLibrary(google);
    const AutocompleteSuggestion = placesLib?.AutocompleteSuggestion;
    if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions) return null;

    const { suggestions } =
      await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
      });
    const first = suggestions?.[0]?.placePrediction;
    if (!first) return null;

    const place = first.toPlace();
    await place.fetchFields({ fields: ["location", "formattedAddress"] });
    const { lat, lng } = readLatLng(place.location);
    if (lat == null || lng == null) return null;

    return {
      lat,
      lng,
      source: "places_new",
      estimated: false,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve lat/lng for the map pin step.
 * Prefer existing coords → Places API (New) → city-table / Lagos default.
 * Never throws — hosts can always proceed with estimated coordinates.
 * Does not call legacy Places Autocomplete or PlacesService.
 */
export async function estimateCoordinates(location = {}) {
  const existingLat = coerceCoordinate(location.lat);
  const existingLng = coerceCoordinate(location.lng);
  if (existingLat != null && existingLng != null) {
    return {
      lat: existingLat,
      lng: existingLng,
      source: "existing",
      estimated: false,
    };
  }

  const query = [
    location.street || location.streetLine1,
    location.city,
    location.state,
    location.zipcode || location.postalCode,
    location.country,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ");

  if (query) {
    const fromPlaces = await geocodeWithPlacesNew(query);
    if (fromPlaces) return fromPlaces;
  }

  return softEstimateCoordinates(location);
}

/**
 * City-table / Lagos soft pin — never touches Google Maps.
 * Use when Maps timed out so the wizard can continue immediately.
 * Safe to call from server and client.
 */
export function softEstimateCoordinates(location = {}) {
  const cityHit = lookupCityCenter(location.city, location.country);
  if (cityHit) {
    return {
      lat: cityHit.lat,
      lng: cityHit.lng,
      source: cityHit.source,
      estimated: true,
    };
  }
  return {
    ...DEFAULT_MAP_CENTER,
    source: "default",
    estimated: true,
  };
}
