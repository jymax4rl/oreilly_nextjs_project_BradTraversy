"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadGoogleMapsApi,
  hasGoogleMapsApiKey,
  describeGoogleMapsError,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";
import { coerceCoordinate } from "@/utils/address";

const KAMA_TEAL = "#1B5C57";
const KAMA_TEAL_SOFT = "#c5ddd9";
const PIN_W = 28;
const PIN_H = 34;
const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 }; // Lagos fallback
const DEFAULT_ZOOM = 3;

/**
 * @typedef {{ id: string, lat: number, lng: number, title?: string }} OpsMapPin
 */

function createPinDom(title) {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", title || "Property location");
  if (title) el.title = title;
  el.style.cssText = [
    "position:absolute",
    "width:" + PIN_W + "px",
    "height:" + PIN_H + "px",
    "margin:0",
    "padding:0",
    "transform:translate(-50%,-100%)",
    "cursor:default",
    "z-index:1000",
    "filter:drop-shadow(0 2px 4px rgba(12,26,26,0.35))",
    "user-select:none",
  ].join(";");
  el.innerHTML = `
    <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;pointer-events:none">
      <path d="M18 42s14-12.4 14-24a14 14 0 10-28 0c0 11.6 14 24 14 24z" fill="${KAMA_TEAL}"/>
      <circle cx="18" cy="16" r="5.5" fill="#fff"/>
      <circle cx="18" cy="16" r="2.4" fill="${KAMA_TEAL}"/>
    </svg>
  `;
  return el;
}

function createStaticPinOverlay(google, { position, title }) {
  class OpsPinOverlay extends google.maps.OverlayView {
    constructor(opts) {
      super();
      this.position_ = opts.position;
      this.title_ = opts.title;
      this.div_ = null;
    }

    onAdd() {
      this.div_ = createPinDom(this.title_);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.div_);
      this.getPanes()?.floatPane.appendChild(this.div_);
    }

    draw() {
      if (!this.div_) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position_);
      if (!point) return;
      this.div_.style.left = `${point.x}px`;
      this.div_.style.top = `${point.y}px`;
    }

    onRemove() {
      if (this.div_?.parentNode) {
        this.div_.parentNode.removeChild(this.div_);
      }
      this.div_ = null;
    }
  }

  return new OpsPinOverlay({ position, title });
}

/**
 * Ops side-panel map: OverlayView pins for filtered listings with valid lat/lng.
 */
export default function OpsListingsMap({
  pins = [],
  className = "h-64 w-full rounded-xl lg:h-[28rem]",
  emptyLabel = "No mapped locations in this result set",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const googleRef = useRef(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const validPins = useMemo(() => {
    const out = [];
    for (const pin of pins) {
      const lat = coerceCoordinate(pin.lat);
      const lng = coerceCoordinate(pin.lng);
      if (lat == null || lng == null) continue;
      out.push({
        id: String(pin.id),
        lat,
        lng,
        title: pin.title || "",
      });
    }
    return out;
  }, [pins]);

  const pinSignature = useMemo(
    () =>
      validPins
        .map((p) => `${p.id}:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
        .join("|"),
    [validPins],
  );

  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => {
      try {
        overlay.setMap(null);
      } catch {
        /* ignore */
      }
    });
    overlaysRef.current = [];
  };

  // Boot map once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (!hasGoogleMapsApiKey()) {
      setErrorInfo(
        describeGoogleMapsError("Google Maps API key is not configured"),
      );
      setLoading(false);
      return;
    }
    if (mapRef.current) return;

    let cancelled = false;
    const safetyMs = GOOGLE_MAPS_LOAD_TIMEOUT_MS + 2_000;
    const safetyTimer = window.setTimeout(() => {
      if (cancelled || mapRef.current) return;
      setErrorInfo(
        describeGoogleMapsError(
          "Google Maps load timed out — continue without interactive map",
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
            "Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, enable Maps JavaScript API, and allow localhost referrers.",
        });
        setLoading(false);
      }
      if (typeof prevAuthFailure === "function") prevAuthFailure();
    };

    loadGoogleMapsApi(["maps"])
      .then((google) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        googleRef.current = google;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: [
            {
              featureType: "water",
              stylers: [{ color: KAMA_TEAL_SOFT }],
            },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        window.clearTimeout(safetyTimer);
        setMapReady(true);
        setLoading(false);
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
      window.gm_authFailure = prevAuthFailure;
      clearOverlays();
      mapRef.current = null;
      googleRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Sync pins whenever the filtered set changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !googleRef.current) return;
    const google = googleRef.current;
    const map = mapRef.current;

    clearOverlays();

    if (validPins.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    validPins.forEach((pin) => {
      const latLng = new google.maps.LatLng(pin.lat, pin.lng);
      bounds.extend(latLng);
      const overlay = createStaticPinOverlay(google, {
        position: latLng,
        title: pin.title,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    if (validPins.length === 1) {
      map.setCenter({ lat: validPins[0].lat, lng: validPins[0].lng });
      map.setZoom(12);
    } else {
      map.fitBounds(bounds, 48);
    }
    // pinSignature captures coordinate identity for the current filtered set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, pinSignature]);

  if (errorInfo) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--kama-field)] px-4 text-center text-sm text-[var(--kama-ink-muted)] ${className}`}
        role="alert"
      >
        <p className="font-medium text-[var(--kama-ink)]">{errorInfo.title}</p>
        <p className="max-w-sm text-xs leading-relaxed">{errorInfo.detail}</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading ? (
        <div
          className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-[var(--kama-field)] text-sm text-[var(--kama-ink-muted)]"
          role="status"
        >
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent"
            aria-hidden
          />
          <span>Loading map…</span>
        </div>
      ) : null}
      {!loading && validPins.length === 0 ? (
        <div
          className="absolute inset-0 z-[2] flex items-center justify-center bg-[var(--kama-field)]/90 px-4 text-center text-sm text-[var(--kama-ink-muted)]"
          role="status"
        >
          {emptyLabel}
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
      {validPins.length > 0 ? (
        <p className="pointer-events-none absolute bottom-2 left-2 z-[3] rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[var(--kama-ink)] shadow-sm backdrop-blur">
          {validPins.length} pin{validPins.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

/** Build map pins from property docs that have usable coordinates. */
export function pinsFromProperties(properties = []) {
  return properties
    .map((p) => {
      const lat = coerceCoordinate(p?.location?.lat);
      const lng = coerceCoordinate(p?.location?.lng);
      if (lat == null || lng == null) return null;
      return {
        id: String(p._id),
        lat,
        lng,
        title: p.name || "Untitled",
      };
    })
    .filter(Boolean);
}
