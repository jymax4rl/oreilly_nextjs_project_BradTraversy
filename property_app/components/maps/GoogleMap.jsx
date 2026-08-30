"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  loadGoogleMapsApi,
  hasGoogleMapsApiKey,
  getGoogleMapsMapId,
  describeGoogleMapsError,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";

const KAMA_TEAL = "#1B5C57";
const KAMA_TEAL_SOFT = "#c5ddd9";

/** Teal teardrop pin for AdvancedMarkerElement HTML content. */
function createKamaPinElement() {
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText =
    "width:36px;height:44px;transform:translateY(-4px);cursor:grab;filter:drop-shadow(0 2px 4px rgba(12,26,26,0.28));";
  wrap.innerHTML = `
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 42s14-12.4 14-24a14 14 0 10-28 0c0 11.6 14 24 14 24z" fill="${KAMA_TEAL}"/>
      <circle cx="18" cy="16" r="5.5" fill="#fff"/>
      <circle cx="18" cy="16" r="2.4" fill="${KAMA_TEAL}"/>
    </svg>
  `;
  return wrap;
}

function readLatLng(position) {
  if (!position) return null;
  const lat =
    typeof position.lat === "function" ? position.lat() : Number(position.lat);
  const lng =
    typeof position.lng === "function" ? position.lng() : Number(position.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function classicTealIcon(google) {
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
    fillColor: KAMA_TEAL,
    fillOpacity: 1,
    strokeColor: "#0c1a1a",
    strokeWeight: 0.6,
    strokeOpacity: 0.35,
    scale: 1.65,
    anchor: new google.maps.Point(12, 22),
  };
}

function scanContainerForMapsError(container) {
  if (!container) return null;
  const errNode =
    container.querySelector(".gm-err-message") ||
    container.querySelector(".gm-err-container") ||
    container.querySelector('[class*="gm-err"]');
  const text = errNode?.textContent?.trim() || "";
  return text || null;
}

function positionsNearlyEqual(a, b, epsilon = 1e-7) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lng - b.lng) < epsilon;
}

export default function GoogleMap({
  lat,
  lng,
  zoom = 15,
  draggable = false,
  onPositionChange,
  className = "h-64 w-full rounded-2xl",
  approximate = false,
  estimated = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerModeRef = useRef(null); // "advanced" | "classic"
  const circleRef = useRef(null);
  const listenersRef = useRef([]);
  const googleRef = useRef(null);
  const draggingRef = useRef(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const stableOnPositionChange = useCallback(
    (pos) => {
      onPositionChange?.(pos);
    },
    [onPositionChange],
  );

  const clearListeners = useCallback(() => {
    listenersRef.current.forEach((l) => {
      try {
        if (l && typeof l.remove === "function") l.remove();
        else if (window.google?.maps?.event && l) {
          window.google.maps.event.removeListener(l);
        }
      } catch {
        /* ignore */
      }
    });
    listenersRef.current = [];
  }, []);

  const clearMarker = useCallback(() => {
    const marker = markerRef.current;
    if (!marker) return;
    try {
      if (markerModeRef.current === "advanced") {
        marker.map = null;
      } else if (typeof marker.setMap === "function") {
        marker.setMap(null);
      }
    } catch {
      /* ignore */
    }
    markerRef.current = null;
    markerModeRef.current = null;
  }, []);

  const attachDragHandlers = useCallback(
    (google, map, mode) => {
      clearListeners();
      if (!draggable || !markerRef.current || !map) return;

      if (mode === "advanced") {
        const advanced = markerRef.current;
        const dragStart = advanced.addListener("dragstart", () => {
          draggingRef.current = true;
        });
        const dragListener = advanced.addListener("dragend", () => {
          draggingRef.current = false;
          const next = readLatLng(advanced.position);
          if (next) stableOnPositionChange(next);
        });
        const clickListener = map.addListener("click", (e) => {
          if (!e.latLng) return;
          const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          advanced.position = next;
          stableOnPositionChange(next);
        });
        listenersRef.current.push(dragStart, dragListener, clickListener);
        return;
      }

      const classic = markerRef.current;
      const dragStart = classic.addListener("dragstart", () => {
        draggingRef.current = true;
      });
      const dragListener = classic.addListener("dragend", () => {
        draggingRef.current = false;
        const next = readLatLng(classic.getPosition());
        if (next) stableOnPositionChange(next);
      });
      const clickListener = map.addListener("click", (e) => {
        const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        classic.setPosition(next);
        stableOnPositionChange(next);
      });
      listenersRef.current.push(dragStart, dragListener, clickListener);
    },
    [clearListeners, draggable, stableOnPositionChange],
  );

  const placeMarker = useCallback(
    async (google, map, center) => {
      clearMarker();

      const mapId = getGoogleMapsMapId();
      let usedAdvanced = false;

      if (mapId) {
        try {
          const markerLib =
            google.maps.marker ||
            (await google.maps.importLibrary("marker").catch(() => null));
          const AdvancedMarkerElement = markerLib?.AdvancedMarkerElement;
          if (AdvancedMarkerElement) {
            const advanced = new AdvancedMarkerElement({
              map,
              position: center,
              title: "Property location",
              gmpDraggable: draggable,
              content: createKamaPinElement(),
            });
            markerRef.current = advanced;
            markerModeRef.current = "advanced";
            usedAdvanced = true;
            attachDragHandlers(google, map, "advanced");
          }
        } catch {
          usedAdvanced = false;
        }
      }

      if (!usedAdvanced) {
        const classic = new google.maps.Marker({
          map,
          position: center,
          draggable,
          animation: google.maps.Animation.DROP,
          icon: classicTealIcon(google),
          title: "Property location",
        });
        markerRef.current = classic;
        markerModeRef.current = "classic";
        attachDragHandlers(google, map, "classic");
      }
    },
    [attachDragHandlers, clearMarker, draggable],
  );

  // Boot map once when coords become available.
  useEffect(() => {
    if (lat == null || lng == null || !containerRef.current) return;
    if (!hasGoogleMapsApiKey()) {
      setErrorInfo(describeGoogleMapsError("Google Maps API key is not configured"));
      setLoading(false);
      return;
    }

    // Already initialized — position sync handled below.
    if (mapRef.current) return;

    let cancelled = false;
    let errorScanTimer = null;
    // Belt-and-suspenders: dismiss overlay even if loader promise never settles.
    const safetyMs = GOOGLE_MAPS_LOAD_TIMEOUT_MS + 2_000;
    const safetyTimer = window.setTimeout(() => {
      if (cancelled || mapRef.current) return;
      setErrorInfo(
        describeGoogleMapsError(
          "Google Maps load timed out — continue with manual address entry",
        ),
      );
      setLoading(false);
    }, safetyMs);

    setLoading(true);
    setErrorInfo(null);

    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) {
        setErrorInfo({
          code: "AuthFailure",
          title: "Google Maps could not authenticate",
          detail:
            "Your API key may be invalid, or this domain is blocked. Check GOOGLE_MAPS_API_KEY (Vercel) or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY locally, enable Maps JavaScript API, add localhost + isisel.com under HTTP referrers, then restart / redeploy.",
        });
        setLoading(false);
      }
      if (typeof prevAuthFailure === "function") prevAuthFailure();
    };

    const mapId = getGoogleMapsMapId();
    const libs = mapId ? ["maps", "marker"] : ["maps"];

    loadGoogleMapsApi(libs)
      .then(async (google) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        googleRef.current = google;
        const center = { lat: Number(lat), lng: Number(lng) };

        const mapOptions = {
          center,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        };

        if (mapId) {
          mapOptions.mapId = mapId;
        } else {
          mapOptions.styles = [
            {
              featureType: "water",
              stylers: [{ color: KAMA_TEAL_SOFT }],
            },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ];
        }

        mapRef.current = new google.maps.Map(containerRef.current, mapOptions);
        await placeMarker(google, mapRef.current, center);

        if (approximate) {
          circleRef.current = new google.maps.Circle({
            map: mapRef.current,
            center,
            radius: 400,
            fillColor: KAMA_TEAL,
            fillOpacity: 0.12,
            strokeColor: KAMA_TEAL,
            strokeOpacity: 0.35,
            strokeWeight: 1,
          });
        }

        errorScanTimer = window.setTimeout(() => {
          if (cancelled) return;
          const errText = scanContainerForMapsError(containerRef.current);
          if (errText) {
            setErrorInfo(describeGoogleMapsError(errText));
            setLoading(false);
          }
        }, 1200);

        if (!cancelled) {
          window.clearTimeout(safetyTimer);
          setErrorInfo(null);
          setMapReady(true);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          window.clearTimeout(safetyTimer);
          setErrorInfo(describeGoogleMapsError(err?.message || String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      if (errorScanTimer) window.clearTimeout(errorScanTimer);
      window.gm_authFailure = prevAuthFailure;
    };
    // Intentionally boot when first coords arrive; updates sync in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat != null && lng != null]);

  // Sync pin / center when address coords change (skip while user is dragging).
  useEffect(() => {
    if (!mapReady || !mapRef.current || lat == null || lng == null) return;
    if (draggingRef.current) return;

    const center = { lat: Number(lat), lng: Number(lng) };
    const marker = markerRef.current;

    if (markerModeRef.current === "advanced" && marker) {
      const current = readLatLng(marker.position);
      if (!positionsNearlyEqual(current, center)) {
        marker.position = center;
        mapRef.current.panTo(center);
      }
    } else if (markerModeRef.current === "classic" && marker) {
      const current = readLatLng(marker.getPosition());
      if (!positionsNearlyEqual(current, center)) {
        marker.setPosition(center);
        mapRef.current.panTo(center);
      }
    } else if (googleRef.current) {
      placeMarker(googleRef.current, mapRef.current, center);
    }

    if (circleRef.current) {
      circleRef.current.setCenter(center);
    }
    // placeMarker is stable enough via refs; omit from deps to avoid remount loops
    // when parent passes a new onPositionChange each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, mapReady]);

  // Re-bind drag when the prop flips.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerRef.current || !googleRef.current) {
      return;
    }
    if (markerModeRef.current === "advanced") {
      markerRef.current.gmpDraggable = draggable;
    } else if (typeof markerRef.current.setDraggable === "function") {
      markerRef.current.setDraggable(draggable);
    }
    attachDragHandlers(
      googleRef.current,
      mapRef.current,
      markerModeRef.current,
    );
  }, [draggable, mapReady, attachDragHandlers]);

  // Drop map instance when coords disappear so the next address can boot cleanly.
  useEffect(() => {
    if (lat != null && lng != null) return;
    clearListeners();
    clearMarker();
    if (circleRef.current) {
      try {
        circleRef.current.setMap(null);
      } catch {
        /* ignore */
      }
      circleRef.current = null;
    }
    mapRef.current = null;
    googleRef.current = null;
    setMapReady(false);
    setLoading(true);
    setErrorInfo(null);
  }, [lat, lng, clearListeners, clearMarker]);

  // Full teardown on unmount.
  useEffect(() => {
    return () => {
      clearListeners();
      clearMarker();
      if (circleRef.current) {
        try {
          circleRef.current.setMap(null);
        } catch {
          /* ignore */
        }
        circleRef.current = null;
      }
      mapRef.current = null;
      googleRef.current = null;
    };
  }, [clearListeners, clearMarker]);

  if (lat == null || lng == null) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--kama-field)] text-sm text-[var(--kama-ink-muted)] ${className}`}
        role="status"
      >
        <MapEmptyArt />
        <span>Set a location to preview the map</span>
      </div>
    );
  }

  if (errorInfo) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-[var(--kama-field)] px-4 text-center text-sm text-[var(--kama-ink-muted)] ${className}`}
        role="alert"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 45%, rgba(27,92,87,0.18), transparent 55%), linear-gradient(rgba(12,26,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(12,26,26,0.04) 1px, transparent 1px)",
            backgroundSize: "auto, 24px 24px, 24px 24px",
          }}
          aria-hidden
        />
        <div className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="10" r="2.2" fill="currentColor" />
          </svg>
        </div>
        <p className="relative z-[1] max-w-xs font-medium text-[var(--kama-ink)]">
          {estimated ? "Map preview unavailable" : errorInfo.title}
        </p>
        <p className="relative z-[1] max-w-sm text-xs leading-relaxed">
          {estimated
            ? "Your approximate pin is saved from the address. You can continue — fix the Maps key later for an interactive map."
            : errorInfo.detail}
        </p>
        <p className="relative z-[1] font-mono text-[11px] text-[var(--kama-accent)]">
          {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading ? (
        <div
          className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-[var(--kama-field)] text-sm text-[var(--kama-ink-muted)]"
          role="status"
          aria-live="polite"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent"
            aria-hidden
          />
          <span>Loading map…</span>
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
      {estimated && !loading ? (
        <p className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-center text-[11px] text-[var(--kama-ink-muted)] shadow-sm backdrop-blur">
          Approximate pin from your address — drag when map is available
        </p>
      ) : null}
    </div>
  );
}

function MapEmptyArt() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        x="6"
        y="10"
        width="36"
        height="28"
        rx="6"
        stroke="var(--kama-accent)"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M24 30s6-4.2 6-9a6 6 0 10-12 0c0 4.8 6 9 6 9z"
        fill="var(--kama-accent-soft)"
        stroke="var(--kama-accent)"
        strokeWidth="1.4"
      />
      <circle cx="24" cy="21" r="1.8" fill="var(--kama-accent)" />
    </svg>
  );
}

