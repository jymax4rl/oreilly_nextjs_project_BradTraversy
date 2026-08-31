"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  loadGoogleMapsApi,
  hasGoogleMapsApiKey,
  describeGoogleMapsError,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";

const KAMA_TEAL = "#1B5C57";
const KAMA_TEAL_SOFT = "#c5ddd9";
const DEFAULT_PIN_ZOOM = 15;
const PIN_W = 36;
const PIN_H = 44;

function readLatLng(position) {
  if (!position) return null;
  const lat =
    typeof position.lat === "function" ? position.lat() : Number(position.lat);
  const lng =
    typeof position.lng === "function" ? position.lng() : Number(position.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Coerce wizard / API coords to finite numbers; null if unusable. */
function coerceFiniteCoord(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
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

function createPinDom() {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", "Property location");
  el.style.cssText = [
    "position:absolute",
    "width:" + PIN_W + "px",
    "height:" + PIN_H + "px",
    "margin:0",
    "padding:0",
    "transform:translate(-50%,-100%)",
    "cursor:grab",
    "z-index:1000",
    "filter:drop-shadow(0 2px 4px rgba(12,26,26,0.35))",
    "user-select:none",
    "-webkit-user-select:none",
    "touch-action:none",
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

/**
 * Geographic pin via OverlayView — DOM element positioned with
 * fromLatLngToDivPixel. Survives environments where classic Marker /
 * AdvancedMarker fail to paint (no Map ID, weekly channel, Docker).
 *
 * Not a fixed CSS center overlay: draw() repositions from lat/lng on every
 * pan/zoom. Drag moves the lat/lng; map pan does not.
 */
function createKamaPinOverlay(google, { position, draggable, onDragStart, onDragEnd }) {
  class KamaPinOverlay extends google.maps.OverlayView {
    constructor(opts) {
      super();
      this.position_ = opts.position;
      this.draggable_ = Boolean(opts.draggable);
      this.onDragStart_ = opts.onDragStart;
      this.onDragEnd_ = opts.onDragEnd;
      this.div_ = null;
      this.moveListener_ = null;
      this.upListener_ = null;
      this.mapWasDraggable_ = true;
    }

    onAdd() {
      this.div_ = createPinDom();
      this.div_.style.cursor = this.draggable_ ? "grab" : "default";

      // Stop map clicks/drags from eating pin pointer events.
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.div_);

      if (this.draggable_) {
        this.div_.addEventListener("pointerdown", this.handlePointerDown_);
      }

      const panes = this.getPanes();
      // floatPane sits above markers; always visible above tiles.
      panes.floatPane.appendChild(this.div_);
    }

    draw() {
      if (!this.div_) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position_);
      if (!point) return;
      this.div_.style.left = point.x + "px";
      this.div_.style.top = point.y + "px";
    }

    onRemove() {
      this.teardownDrag_();
      if (this.div_?.parentNode) {
        this.div_.parentNode.removeChild(this.div_);
      }
      this.div_ = null;
    }

    getPosition() {
      return this.position_;
    }

    setPosition(latLng) {
      this.position_ = latLng;
      this.draw();
    }

    setDraggable(value) {
      this.draggable_ = Boolean(value);
      if (!this.div_) return;
      this.div_.style.cursor = this.draggable_ ? "grab" : "default";
      this.div_.removeEventListener("pointerdown", this.handlePointerDown_);
      if (this.draggable_) {
        this.div_.addEventListener("pointerdown", this.handlePointerDown_);
      }
    }

    handlePointerDown_ = (e) => {
      if (!this.draggable_ || e.button != null && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const map = this.getMap();
      if (!map) return;

      this.mapWasDraggable_ = map.get("draggable") !== false;
      map.set("draggable", false);
      if (this.div_) this.div_.style.cursor = "grabbing";
      this.onDragStart_?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = this.getProjection()?.fromLatLngToDivPixel(this.position_);
      if (!startPos) return;

      const onMove = (ev) => {
        const projection = this.getProjection();
        if (!projection) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const next = projection.fromDivPixelToLatLng(
          new google.maps.Point(startPos.x + dx, startPos.y + dy),
        );
        if (!next) return;
        this.position_ = next;
        this.draw();
      };

      const onUp = (ev) => {
        this.teardownDrag_();
        if (this.div_) this.div_.style.cursor = "grab";
        if (map) map.set("draggable", this.mapWasDraggable_);
        const next = readLatLng(this.position_);
        this.onDragEnd_?.(next);
        // Prevent the same pointerup from becoming a map click.
        ev.preventDefault?.();
        ev.stopPropagation?.();
      };

      this.moveListener_ = onMove;
      this.upListener_ = onUp;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
      window.addEventListener("pointercancel", onUp, { once: true });
    };

    teardownDrag_() {
      if (this.moveListener_) {
        window.removeEventListener("pointermove", this.moveListener_);
        this.moveListener_ = null;
      }
      if (this.upListener_) {
        window.removeEventListener("pointerup", this.upListener_);
        window.removeEventListener("pointercancel", this.upListener_);
        this.upListener_ = null;
      }
    }
  }

  const overlay = new KamaPinOverlay({
    position,
    draggable,
    onDragStart,
    onDragEnd,
  });
  return overlay;
}

/**
 * Property map with a geographic OverlayView pin (lat/lng anchored).
 * Never uses a fixed CSS center overlay. Works without Map ID in Docker.
 */
export default function GoogleMap({
  lat,
  lng,
  zoom = DEFAULT_PIN_ZOOM,
  draggable = false,
  onPositionChange,
  className = "h-64 w-full rounded-2xl",
  approximate = false,
  estimated = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pinRef = useRef(null);
  const circleRef = useRef(null);
  const listenersRef = useRef([]);
  const googleRef = useRef(null);
  const draggingRef = useRef(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const safeLat = coerceFiniteCoord(lat);
  const safeLng = coerceFiniteCoord(lng);

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

  const clearPin = useCallback(() => {
    const pin = pinRef.current;
    if (!pin) return;
    try {
      pin.setMap(null);
    } catch {
      /* ignore */
    }
    pinRef.current = null;
  }, []);

  const centerMapOn = useCallback(
    (map, center, nextZoom = zoom) => {
      if (!map || !center) return;
      map.setCenter(center);
      if (typeof map.setZoom === "function" && nextZoom != null) {
        map.setZoom(nextZoom);
      }
    },
    [zoom],
  );

  const placePin = useCallback(
    (google, map, center) => {
      clearPin();
      const latLng = new google.maps.LatLng(center.lat, center.lng);
      const overlay = createKamaPinOverlay(google, {
        position: latLng,
        draggable,
        onDragStart: () => {
          draggingRef.current = true;
        },
        onDragEnd: (next) => {
          draggingRef.current = false;
          if (next) {
            map.panTo(next);
            stableOnPositionChange(next);
          }
        },
      });
      overlay.setMap(map);
      pinRef.current = overlay;

      clearListeners();
      if (draggable) {
        const clickListener = map.addListener("click", (e) => {
          if (!e.latLng || draggingRef.current) return;
          const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          overlay.setPosition(e.latLng);
          map.panTo(next);
          stableOnPositionChange(next);
        });
        listenersRef.current.push(clickListener);
      }
    },
    [clearListeners, clearPin, draggable, stableOnPositionChange],
  );

  // Boot map once when finite coords become available.
  useEffect(() => {
    if (safeLat == null || safeLng == null || !containerRef.current) return;
    if (!hasGoogleMapsApiKey()) {
      setErrorInfo(describeGoogleMapsError("Google Maps API key is not configured"));
      setLoading(false);
      return;
    }

    if (mapRef.current) return;

    let cancelled = false;
    let errorScanTimer = null;
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

    // No Map ID — OverlayView works on raster maps; classic Marker is unreliable here.
    loadGoogleMapsApi(["maps"])
      .then(async (google) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        googleRef.current = google;
        const center = { lat: safeLat, lng: safeLng };

        mapRef.current = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          // Explicitly omit mapId so we stay on raster tiles (OverlayView-friendly).
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

        centerMapOn(mapRef.current, center, zoom);
        placePin(google, mapRef.current, center);

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

        // After tiles settle, re-assert center/zoom/pin (place-select race).
        const idleOnce = mapRef.current.addListener("idle", () => {
          google.maps.event.removeListener(idleOnce);
          if (cancelled || !mapRef.current) return;
          centerMapOn(mapRef.current, center, zoom);
          if (pinRef.current) {
            pinRef.current.setPosition(
              new google.maps.LatLng(center.lat, center.lng),
            );
          } else {
            placePin(google, mapRef.current, center);
          }
        });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLat != null && safeLng != null]);

  // Sync geographic pin + center when address coords change.
  useEffect(() => {
    if (!mapReady || !mapRef.current || safeLat == null || safeLng == null) return;
    if (draggingRef.current) return;

    const center = { lat: safeLat, lng: safeLng };
    const google = googleRef.current;
    const pin = pinRef.current;

    if (pin && google) {
      const current = readLatLng(pin.getPosition());
      if (!positionsNearlyEqual(current, center)) {
        pin.setPosition(new google.maps.LatLng(center.lat, center.lng));
        centerMapOn(mapRef.current, center, zoom);
      }
    } else if (google) {
      centerMapOn(mapRef.current, center, zoom);
      placePin(google, mapRef.current, center);
    }

    if (circleRef.current) {
      circleRef.current.setCenter(center);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLat, safeLng, mapReady, zoom]);

  // Re-bind dragability when the prop flips.
  useEffect(() => {
    if (!mapReady || !pinRef.current) return;
    if (typeof pinRef.current.setDraggable === "function") {
      pinRef.current.setDraggable(draggable);
    }
    // Re-attach map click when enabling drag.
    if (googleRef.current && mapRef.current) {
      const center = readLatLng(pinRef.current.getPosition()) || {
        lat: safeLat,
        lng: safeLng,
      };
      if (center.lat != null && center.lng != null) {
        placePin(googleRef.current, mapRef.current, center);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggable, mapReady]);

  // Drop map when coords disappear.
  useEffect(() => {
    if (safeLat != null && safeLng != null) return;
    clearListeners();
    clearPin();
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
  }, [safeLat, safeLng, clearListeners, clearPin]);

  // Full teardown on unmount.
  useEffect(() => {
    return () => {
      clearListeners();
      clearPin();
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
  }, [clearListeners, clearPin]);

  if (safeLat == null || safeLng == null) {
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
          {safeLat.toFixed(4)}, {safeLng.toFixed(4)}
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
        <p className="absolute bottom-2 left-2 right-2 z-[3] rounded-lg bg-white/90 px-2 py-1 text-center text-[11px] text-[var(--kama-ink-muted)] shadow-sm backdrop-blur">
          Approximate pin from your address — drag the pin when map is available
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
