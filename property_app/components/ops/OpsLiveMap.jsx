"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadGoogleMapsApi,
  hasGoogleMapsApiKey,
  describeGoogleMapsError,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";
import { coerceCoordinate } from "@/utils/address";

const DEFAULT_CENTER = { lat: 7.2, lng: 21.5 };
const DEFAULT_ZOOM = 3;

function createDotDom(title) {
  const el = document.createElement("div");
  el.className = "ops-live-dot";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", title || "Visitor");
  if (title) el.title = title;
  el.innerHTML =
    '<span class="ops-live-dot__pulse" aria-hidden="true"></span><span class="ops-live-dot__core" aria-hidden="true"></span>';
  el.style.setProperty("--ops-live-delay", `${Math.random() * 1.6}s`);
  return el;
}

function createDotOverlay(google, { position, title }) {
  class LiveDotOverlay extends google.maps.OverlayView {
    constructor(opts) {
      super();
      this.position_ = opts.position;
      this.title_ = opts.title;
      this.div_ = null;
    }

    onAdd() {
      this.div_ = createDotDom(this.title_);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.div_);
      this.getPanes()?.overlayMouseTarget.appendChild(this.div_);
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

  return new LiveDotOverlay({ position, title });
}

/**
 * Shopify Live View-style 2D map: small pulsing dots for guests browsing
 * the public site in the last 5 minutes. Stays at world zoom; staff can
 * drag and zoom. Does not identify a person — country/city only.
 */
export default function OpsLiveMap({
  dots = [],
  activeCount = 0,
  className = "h-[320px] w-full sm:h-[380px]",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const googleRef = useRef(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const validDots = useMemo(() => {
    const out = [];
    for (const dot of dots) {
      const lat = coerceCoordinate(dot.lat);
      const lng = coerceCoordinate(dot.lng);
      if (lat == null || lng == null) continue;
      const place = [dot.city, dot.country].filter(Boolean).join(", ");
      const approx = dot.source === "tz" ? "approx. from timezone" : "";
      out.push({
        lat,
        lng,
        title: [place || "Guest browsing", approx].filter(Boolean).join(" · "),
      });
    }
    return out;
  }, [dots]);

  const signature = useMemo(
    () =>
      validDots
        .map((d) => `${d.lat.toFixed(2)},${d.lng.toFixed(2)}`)
        .join("|"),
    [validDots],
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
            "Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, enable Maps JavaScript API, and allow this host as a referrer.",
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
          minZoom: 2,
          maxZoom: 7,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          backgroundColor: "#f7f9f8",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#eef3f1" }] },
            { elementType: "labels", stylers: [{ visibility: "off" }] },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#d5e0dc" }, { weight: 0.6 }],
            },
            {
              featureType: "administrative.country",
              elementType: "geometry.stroke",
              stylers: [{ visibility: "on" }, { color: "#c5d4cf" }],
            },
            {
              featureType: "landscape",
              stylers: [{ color: "#e8eeec" }],
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "road",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "water",
              stylers: [{ color: "#ffffff" }],
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

  useEffect(() => {
    if (!mapReady || !mapRef.current || !googleRef.current) return;
    const google = googleRef.current;
    const map = mapRef.current;
    clearOverlays();

    validDots.forEach((dot) => {
      const overlay = createDotOverlay(google, {
        position: new google.maps.LatLng(dot.lat, dot.lng),
        title: dot.title,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
    // signature is the coordinate identity of the current live set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, signature]);

  const located = validDots.length;
  const browsing = Number(activeCount) || 0;
  const people = browsing || located;

  return (
    <figure className="ops-card ops-card--flush">
      <figcaption className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5">
        <div>
          <p className="ops-chart-title inline-flex items-center gap-2">
            <span className="ops-live-now" aria-hidden />
            Live view
          </p>
          <p className="ops-chart-sub mt-1">
            Open tabs in the last 5 minutes
            {browsing > located
              ? ` · ${located} located`
              : ""}
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
          {people.toLocaleString()}{" "}
          <span className="font-medium text-[var(--kama-ink-muted)]">
            {people === 1 ? "visitor right now" : "visitors right now"}
          </span>
        </p>
      </figcaption>

      {errorInfo ? (
        <div
          className={`mt-4 flex flex-col items-center justify-center gap-2 bg-[var(--kama-field)] px-4 text-center text-sm text-[var(--kama-ink-muted)] ${className}`}
          role="alert"
        >
          <p className="font-medium text-[var(--kama-ink)]">{errorInfo.title}</p>
          <p className="max-w-sm text-xs leading-relaxed">{errorInfo.detail}</p>
        </div>
      ) : (
        <div className={`relative mt-4 overflow-hidden ${className}`}>
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
          <div ref={containerRef} className="h-full w-full" />
          {!loading && validDots.length === 0 ? (
            <p className="pointer-events-none absolute bottom-3 left-3 z-[3] max-w-[16rem] rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-[var(--kama-ink-muted)] shadow-sm backdrop-blur">
              Dots appear as guests browse listings and the home page.
            </p>
          ) : (
            <p className="pointer-events-none absolute bottom-3 left-3 z-[3] inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[var(--kama-ink)] shadow-sm backdrop-blur">
              <span className="ops-live-dot-legend" aria-hidden />
              Browsing now
            </p>
          )}
        </div>
      )}
    </figure>
  );
}
