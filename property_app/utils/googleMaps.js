let mapsLoaderPromise = null;
const loadedLibraries = new Set();

/** Hard ceiling — never leave callers hanging on a blocked/missing Maps script. */
export const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 10_000;

function getApiKey() {
  // Prefer NEXT_PUBLIC_*; also accept GOOGLE_MAPS_API_KEY (Vercel env name).
  // next.config.mjs maps GOOGLE_MAPS_API_KEY → NEXT_PUBLIC_ at build time for the browser.
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    ""
  ).trim();
}

/**
 * Cloud console Map ID (Map Management) required for Advanced Markers.
 * Leave empty to use classic `google.maps.Marker` (pin still shows).
 * For local testing you may set `DEMO_MAP_ID` (Google docs sample id).
 */
export function getGoogleMapsMapId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
    process.env.GOOGLE_MAPS_MAP_ID ||
    ""
  ).trim();
}

/** True when a browser-exposed Maps/Places key is configured. */
export function hasGoogleMapsApiKey() {
  return Boolean(getApiKey());
}

/**
 * Map user-facing error copy from Google Maps auth / load failures.
 * Do not include the raw API key in any message.
 */
export function describeGoogleMapsError(raw = "") {
  const text = String(raw || "");
  const lower = text.toLowerCase();

  if (
    /timed?\s*out|timeout|took too long/i.test(text) ||
    lower.includes("load timed out")
  ) {
    return {
      code: "LoadTimeout",
      title: "Map took too long to load",
      detail:
        "Google Maps did not respond in time (blocked network, slow connection, or key issue). Continue with your address — the pin can be adjusted later when Maps is available.",
    };
  }

  if (
    /legacyapinotactivated|legacy.?api.?not.?activated/i.test(text) ||
    lower.includes("legacyapinotactivatedmaperror")
  ) {
    return {
      code: "LegacyApiNotActivatedMapError",
      title: "Legacy Places API is not enabled (and should stay off)",
      detail:
        "This app uses Places API (New), not the legacy Places Autocomplete. In Google Cloud Console → APIs & Services → Library, enable Places API (New) and Maps JavaScript API. Leave legacy Places disabled.",
    };
  }

  if (
    /apinotactivated|api.?not.?activated/i.test(text) ||
    lower.includes("apinotactivatedmaperror")
  ) {
    return {
      code: "ApiNotActivatedMapError",
      title: "Maps JavaScript API is not enabled",
      detail:
        "In Google Cloud Console → APIs & Services → Library, enable Maps JavaScript API and Places API (New). Then wait a minute and refresh.",
    };
  }

  if (
    /referernotallowed|referer.?not.?allowed|referrer/i.test(text) ||
    lower.includes("referernotallowedmaperror")
  ) {
    return {
      code: "RefererNotAllowedMapError",
      title: "This site is not allowed for your API key",
      detail:
        "In Credentials → your key → Application restrictions, add HTTP referrers: http://localhost:3000/* and https://www.isisel.com/*. Restart the browser after saving.",
    };
  }

  if (
    /invalidkey|invalid.?key|deleted.?api.?key/i.test(text) ||
    lower.includes("invalidkeymaperror")
  ) {
    return {
      code: "InvalidKeyMapError",
      title: "Google Maps API key is invalid",
      detail:
        "Check GOOGLE_MAPS_API_KEY (Vercel) or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local (no quotes), then restart / redeploy.",
    };
  }

  if (/not configured|api key/i.test(text) && /not/i.test(text)) {
    return {
      code: "MissingKey",
      title: "Google Maps API key missing",
      detail:
        "Set GOOGLE_MAPS_API_KEY on Vercel (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY locally), enable Maps JavaScript API + Places API (New), then redeploy / restart npm run dev.",
    };
  }

  return {
    code: "Unknown",
    title: "Map preview unavailable",
    detail:
      "Check GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, enable Maps JavaScript API + Places API (New), and allow localhost + isisel.com referrers. You can still continue with this pin.",
  };
}

function clearWindowCallback(name) {
  try {
    delete window[name];
  } catch {
    window[name] = undefined;
  }
}

/**
 * Load Google Maps JS API once in the browser.
 * Uses an explicit callback (more reliable than script.onload with loading=async)
 * and `importLibrary` when available so Places / marker can load after a bare maps boot.
 *
 * Never hangs forever: rejects after GOOGLE_MAPS_LOAD_TIMEOUT_MS so UI can soft-fail
 * to manual address entry.
 *
 * Preferred libraries for Kama: places (Places API New autocomplete), marker.
 * Callers should request only what they need — map display does not need places.
 */
export function loadGoogleMapsApi(libraries = ["maps"]) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  const libs = [...new Set(libraries.filter(Boolean))];

  const ensureLibraries = async (google) => {
    const importTimeoutMs = 8_000;
    for (const lib of libs) {
      if (loadedLibraries.has(lib)) continue;
      if (lib === "places" && google.maps?.places) {
        loadedLibraries.add(lib);
        continue;
      }
      if (lib === "marker" && google.maps?.marker) {
        loadedLibraries.add(lib);
        continue;
      }
      if (lib === "maps" && google.maps?.Map) {
        loadedLibraries.add(lib);
        continue;
      }
      if (typeof google.maps.importLibrary === "function") {
        await Promise.race([
          google.maps.importLibrary(lib),
          new Promise((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Google Maps library "${lib}" import timed out`,
                  ),
                ),
              importTimeoutMs,
            );
          }),
        ]);
        loadedLibraries.add(lib);
      }
    }
    return google;
  };

  if (window.google?.maps) {
    const needsPlaces = libs.includes("places") && !window.google.maps.places;
    const needsMarker = libs.includes("marker") && !window.google.maps.marker;
    const needsMaps =
      libs.includes("maps") && typeof window.google.maps.Map !== "function";
    if (!needsPlaces && !needsMarker && !needsMaps) {
      libs.forEach((l) => loadedLibraries.add(l));
      return Promise.resolve(window.google);
    }
    return ensureLibraries(window.google).catch((err) => {
      mapsLoaderPromise = null;
      throw err;
    });
  }

  if (!mapsLoaderPromise) {
    mapsLoaderPromise = new Promise((resolve, reject) => {
      const callbackName = `__kamaInitGoogleMaps_${Date.now()}`;
      const existing = document.querySelector('script[data-google-maps="true"]');
      let settled = false;
      let pollId = null;
      let timeoutId = null;

      const cleanupTimers = () => {
        if (pollId != null) {
          clearInterval(pollId);
          pollId = null;
        }
        if (timeoutId != null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const fail = (message) => {
        if (settled) return;
        settled = true;
        cleanupTimers();
        clearWindowCallback(callbackName);
        mapsLoaderPromise = null;
        reject(new Error(message));
      };

      const finish = () => {
        if (settled) return;
        if (!window.google?.maps) {
          fail("Google Maps failed to initialize");
          return;
        }
        settled = true;
        cleanupTimers();
        clearWindowCallback(callbackName);
        resolve(window.google);
      };

      timeoutId = setTimeout(() => {
        fail(
          "Google Maps load timed out — continue with manual address entry",
        );
      }, GOOGLE_MAPS_LOAD_TIMEOUT_MS);

      // Poll in case callback/load already fired or races with async loading=
      pollId = setInterval(() => {
        if (window.google?.maps) finish();
      }, 200);

      window[callbackName] = () => {
        finish();
      };

      if (existing) {
        if (window.google?.maps) {
          finish();
          return;
        }
        existing.addEventListener("load", finish);
        existing.addEventListener("error", () => {
          fail("Failed to load Google Maps");
        });
        return;
      }

      const params = new URLSearchParams({
        key: apiKey,
        v: "weekly",
        loading: "async",
        callback: callbackName,
      });
      // Only request libraries the caller needs. Map pin display uses maps/marker;
      // address search requests places separately (Places API New).
      const bootLibs = libs.length > 0 ? libs : ["maps"];
      if (bootLibs.length) {
        params.set("libraries", bootLibs.join(","));
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";
      script.dataset.googleMapsLibs = bootLibs.sort().join(",");
      script.onerror = () => {
        fail("Failed to load Google Maps");
      };
      document.head.appendChild(script);
    }).then((google) => {
      libs.forEach((l) => loadedLibraries.add(l));
      return google;
    });
  }

  return mapsLoaderPromise
    .then((google) => ensureLibraries(google))
    .catch((err) => {
      // Allow a later retry after a hard failure / timeout.
      mapsLoaderPromise = null;
      throw err;
    });
}

