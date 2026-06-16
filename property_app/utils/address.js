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
  return components.find((c) => c.types.includes(type));
}

/** Parse a Google Places `PlaceResult` into our address shape. */
export function parseGooglePlace(place) {
  if (!place?.address_components?.length) {
    return null;
  }

  const components = place.address_components;
  const streetNumber = getComponent(components, COMPONENT_TYPES.streetNumber);
  const route = getComponent(components, COMPONENT_TYPES.route);
  const locality =
    getComponent(components, COMPONENT_TYPES.locality) ||
    getComponent(components, COMPONENT_TYPES.sublocality) ||
    getComponent(components, COMPONENT_TYPES.adminArea2);
  const state = getComponent(components, COMPONENT_TYPES.adminArea1);
  const country = getComponent(components, COMPONENT_TYPES.country);
  const postalCode = getComponent(components, COMPONENT_TYPES.postalCode);

  const streetLine1 = [streetNumber?.long_name, route?.long_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const lat = place.geometry?.location?.lat?.();
  const lng = place.geometry?.location?.lng?.();

  return {
    formatted: place.formatted_address || "",
    streetLine1: streetLine1 || place.formatted_address?.split(",")[0] || "",
    streetLine2: "",
    city: locality?.long_name || "",
    state: state?.short_name || state?.long_name || "",
    postalCode: postalCode?.long_name || "",
    country: country?.long_name || "",
    countryCode: country?.short_name || "",
    placeId: place.place_id || "",
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
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
      input.formatted?.trim() || formatAddress({ ...input, streetLine1, city, country }),
    lat:
      typeof input.lat === "number" && !Number.isNaN(input.lat) ? input.lat : null,
    lng:
      typeof input.lng === "number" && !Number.isNaN(input.lng) ? input.lng : null,
  };

  return normalized;
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
  return Boolean(normalized?.streetLine1 && normalized?.city && normalized?.country);
}

let mapsLoaderPromise = null;

/** Load Google Maps JS (Places) once in the browser. */
export function loadGoogleMapsPlaces() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured"));
  }

  if (typeof window !== "undefined" && window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!mapsLoaderPromise) {
    mapsLoaderPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  }

  return mapsLoaderPromise;
}
