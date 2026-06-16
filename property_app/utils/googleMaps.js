let mapsLoaderPromise = null;

/** Load Google Maps JS API once in the browser. */
export function loadGoogleMapsApi(libraries = ["places"]) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured"));
  }

  const libs = [...new Set(libraries)];
  const cacheKey = libs.sort().join(",");

  if (typeof window !== "undefined" && window.google?.maps) {
    const hasPlaces = !libs.includes("places") || window.google.maps.places;
    const hasMarker = !libs.includes("marker") || window.google.maps.marker;
    if (hasPlaces && hasMarker) {
      return Promise.resolve(window.google);
    }
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libs.join(",")}&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";
      script.dataset.googleMapsLibs = cacheKey;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  }

  return mapsLoaderPromise;
}
