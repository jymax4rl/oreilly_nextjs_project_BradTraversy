"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  loadGoogleMapsApi,
  hasGoogleMapsApiKey,
  describeGoogleMapsError,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";
import { coerceCoordinate } from "@/utils/address";
import { formatListingPrice } from "@/utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import "@/components/maps/property-explore-map.css";

const DEFAULT_CENTER = { lat: 14.7167, lng: -17.4677 }; // Dakar
const DEFAULT_ZOOM = 5;

function createPriceMarkerDom({
  label,
  selected,
  onClick,
  title,
}) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `pem-marker${selected ? " pem-marker--selected" : ""}`;
  el.setAttribute("aria-label", title ? `${title}: ${label}` : label);
  el.textContent = label;
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.();
  });
  return el;
}

function createPriceOverlay(google, { position, label, selected, title, onClick }) {
  class PriceOverlay extends google.maps.OverlayView {
    constructor(opts) {
      super();
      this.position_ = opts.position;
      this.label_ = opts.label;
      this.selected_ = opts.selected;
      this.title_ = opts.title;
      this.onClick_ = opts.onClick;
      this.div_ = null;
    }

    onAdd() {
      this.div_ = createPriceMarkerDom({
        label: this.label_,
        selected: this.selected_,
        title: this.title_,
        onClick: this.onClick_,
      });
      google.maps.OverlayView.preventMapHitsFrom(this.div_);
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
      if (this.div_?.parentNode) this.div_.parentNode.removeChild(this.div_);
      this.div_ = null;
    }

    setSelected(selected) {
      this.selected_ = selected;
      if (this.div_) {
        this.div_.classList.toggle("pem-marker--selected", Boolean(selected));
      }
    }

    setLabel(label) {
      this.label_ = label;
      if (this.div_) this.div_.textContent = label;
    }
  }

  return new PriceOverlay({ position, label, selected, title, onClick });
}

/**
 * Guest explore map — price-pill markers tied to property IDs.
 */
export default function PropertyExploreMap({
  pins = [],
  selectedId = null,
  onSelect,
  onBoundsChange,
  loading = false,
  className = "",
  fitOnPinsChange = false,
}) {
  const { currencyCode, rates } = useCurrency();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const googleRef = useRef(null);
  const overlaysRef = useRef(new Map());
  const idleListenerRef = useRef(null);
  const requestSeqRef = useRef(0);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectRef = useRef(onSelect);
  const [errorInfo, setErrorInfo] = useState(() =>
    hasGoogleMapsApiKey()
      ? null
      : describeGoogleMapsError("Google Maps API key is not configured"),
  );
  const [mapReady, setMapReady] = useState(false);
  const [booting, setBooting] = useState(() => hasGoogleMapsApiKey());
  const [bootKey, setBootKey] = useState(0);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const clearMapInstance = () => {
    if (idleListenerRef.current) {
      idleListenerRef.current.remove?.();
      idleListenerRef.current = null;
    }
    for (const overlay of overlaysRef.current.values()) {
      overlay.setMap?.(null);
    }
    overlaysRef.current.clear();
    const map = mapRef.current;
    if (map?.__pemIdleTimer) {
      window.clearTimeout(map.__pemIdleTimer);
    }
    mapRef.current = null;
    googleRef.current = null;
    setMapReady(false);
  };

  const handleRefreshMap = () => {
    if (booting) return;
    clearMapInstance();
    setErrorInfo(null);
    setBooting(true);
    setBootKey((k) => k + 1);
  };

  const validPins = useMemo(() => {
    const out = [];
    for (const pin of pins) {
      const lat = coerceCoordinate(pin.lat);
      const lng = coerceCoordinate(pin.lng);
      if (lat == null || lng == null) continue;
      out.push({ ...pin, lat, lng, id: String(pin.id) });
    }
    return out;
  }, [pins]);

  const emitBounds = () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds?.();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    const payload = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
      zoom: map.getZoom?.() ?? DEFAULT_ZOOM,
      seq: ++requestSeqRef.current,
    };
    onBoundsChangeRef.current?.(payload);
  };

  // Boot map (re-runs when user taps Refresh).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    if (!hasGoogleMapsApiKey()) {
      setBooting(false);
      setErrorInfo(
        describeGoogleMapsError("Google Maps API key is not configured"),
      );
      return undefined;
    }
    if (mapRef.current) return undefined;

    let cancelled = false;
    const safetyTimer = window.setTimeout(() => {
      if (cancelled || mapRef.current) return;
      setErrorInfo(
        describeGoogleMapsError(
          "Google Maps load timed out — continue without interactive map",
        ),
      );
      setBooting(false);
    }, GOOGLE_MAPS_LOAD_TIMEOUT_MS + 2000);

    setBooting(true);
    setErrorInfo(null);

    loadGoogleMapsApi(["maps"])
      .then((google) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        googleRef.current = google;
        const map = new google.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          // Omit mapId for OverlayView-friendly raster tiles (same as listing maps).
        });
        mapRef.current = map;
        idleListenerRef.current = map.addListener("idle", () => {
          // Debounce slightly after idle to coalesce pan/zoom ends.
          window.clearTimeout(map.__pemIdleTimer);
          map.__pemIdleTimer = window.setTimeout(() => {
            if (!cancelled) emitBounds();
          }, 280);
        });
        setMapReady(true);
        setBooting(false);
        // Initial bounds after first idle.
        google.maps.event.addListenerOnce(map, "idle", () => emitBounds());
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorInfo(describeGoogleMapsError(err?.message || String(err)));
          setBooting(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      if (idleListenerRef.current) {
        idleListenerRef.current.remove?.();
        idleListenerRef.current = null;
      }
    };
  }, [bootKey]);

  // Sync overlays when pins / currency / selection change.
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!google || !map || !mapReady) return;

    const nextIds = new Set(validPins.map((p) => p.id));

    // Remove stale
    for (const [id, overlay] of overlaysRef.current.entries()) {
      if (!nextIds.has(id)) {
        overlay.setMap(null);
        overlaysRef.current.delete(id);
      }
    }

    for (const pin of validPins) {
      const label =
        pin.priceUsd != null
          ? formatListingPrice(pin.priceUsd, rates, currencyCode)
          : "—";
      const selected = selectedId != null && String(selectedId) === pin.id;
      const existing = overlaysRef.current.get(pin.id);
      if (existing) {
        existing.setLabel(label);
        existing.setSelected(selected);
        continue;
      }
      const overlay = createPriceOverlay(google, {
        position: new google.maps.LatLng(pin.lat, pin.lng),
        label,
        selected,
        title: pin.title,
        onClick: () => onSelectRef.current?.(pin.id),
      });
      overlay.setMap(map);
      overlaysRef.current.set(pin.id, overlay);
    }

    if (fitOnPinsChange && validPins.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validPins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 48);
    }
  }, [
    validPins,
    selectedId,
    currencyCode,
    rates,
    mapReady,
    fitOnPinsChange,
  ]);

  // Reflow tiles when the shell Flip changes the canvas size.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return undefined;
    const google = googleRef.current;
    const map = mapRef.current;
    const el = containerRef.current;

    const triggerResize = () => {
      google?.maps?.event?.trigger?.(map, "resize");
      // Blank grey canvas happens when Maps booted at 0×0 during Flip —
      // an idle nudge refreshes tiles + pin bounds after the shell settles.
      window.setTimeout(() => {
        google?.maps?.event?.trigger?.(map, "idle");
      }, 60);
    };

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => triggerResize())
        : null;
    ro?.observe(el);
    el.addEventListener("pem-container-resize", triggerResize);
    window.addEventListener("resize", triggerResize);

    return () => {
      ro?.disconnect();
      el.removeEventListener("pem-container-resize", triggerResize);
      window.removeEventListener("resize", triggerResize);
    };
  }, [mapReady]);

  return (
    <div className={`pem-root ${className}`.trim()}>
      <div ref={containerRef} className="pem-canvas" role="application" aria-label="Stays map" />
      <div
        className={`pem-progress${booting || loading ? " pem-progress--active" : ""}`}
        aria-hidden={!booting && !loading}
      >
        <span className="pem-progress__bar" />
      </div>
      <span className="pem-sr-only" aria-live="polite">
        {booting ? "Loading map" : loading ? "Updating stays for this map area" : ""}
      </span>
      {errorInfo ? (
        <div className="pem-error" role="alert">
          <button
            type="button"
            className="pem-error__refresh"
            onClick={handleRefreshMap}
            disabled={booting}
          >
            <RefreshCw
              className={`pem-error__refresh-icon${booting ? " pem-error__refresh-icon--spin" : ""}`}
              aria-hidden
            />
            {booting ? "Loading map…" : "Refresh map"}
          </button>
        </div>
      ) : null}
      {!loading && !booting && !errorInfo && validPins.length === 0 ? (
        <div className="pem-empty" role="status">
          <p className="font-semibold">No stays found in this area</p>
          <p className="text-sm opacity-80">Zoom out or adjust filters.</p>
        </div>
      ) : null}
    </div>
  );
}
