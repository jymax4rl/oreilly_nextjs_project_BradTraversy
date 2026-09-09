"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Map as MapIcon, List, X } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import PropertyExploreMap from "@/components/maps/PropertyExploreMap";
import { formatListingPrice } from "@/utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import "@/components/maps/property-explore-map.css";

function buildQueryFromFilters(filters, bounds) {
  const params = new URLSearchParams();
  if (filters.location) params.set("location", filters.location);
  if (filters.type && filters.type !== "All Properties") {
    params.set("type", filters.type);
  }
  if (filters.minPrice != null && filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.minBeds) params.set("minBeds", String(filters.minBeds));
  if (filters.minBaths) params.set("minBaths", String(filters.minBaths));
  if (filters.checkIn) params.set("checkIn", filters.checkIn);
  if (filters.checkOut) params.set("checkOut", filters.checkOut);
  if (bounds) {
    params.set("north", String(bounds.north));
    params.set("south", String(bounds.south));
    params.set("east", String(bounds.east));
    params.set("west", String(bounds.west));
  }
  params.set("limit", "80");
  return params;
}

function pinToCardProperty(pin) {
  const displayNightly =
    pin.priceUsd != null && Number.isFinite(Number(pin.priceUsd))
      ? Number(pin.priceUsd)
      : pin.listingPrice;
  return {
    _id: pin.id,
    id: pin.id,
    slug: pin.slug,
    name: pin.title,
    type: pin.type,
    beds: pin.beds,
    baths: pin.baths,
    listingPrice: displayNightly,
    rates: {
      ...(pin.rates && typeof pin.rates === "object" ? pin.rates : {}),
      nightly: displayNightly,
    },
    images: pin.thumbnail ? [pin.thumbnail] : [],
    location: {
      city: pin.city,
      country: pin.country,
      lat: pin.lat,
      lng: pin.lng,
    },
  };
}

/**
 * Synchronized list + map explore experience.
 * When `locked`, desktop uses a viewport grid: scrollable list | fixed map.
 */
export default function PropertyExploreExperience({
  initialProperties = [],
  filters = {},
  compact = false,
  locked = false,
  listHeader = null,
}) {
  const { currencyCode, rates } = useCurrency();
  const [pins, setPins] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [bounds, setBounds] = useState(null);
  const abortRef = useRef(null);
  const seqRef = useRef(0);
  const cardRefs = useRef(new Map());
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) setMobileMapOpen(false);
    };
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort?.();
    };
  }, []);

  useEffect(() => {
    if (!mobileMapOpen) return undefined;
    document.body.classList.add("pem-map-open");
    const onKey = (e) => {
      if (e.key === "Escape") setMobileMapOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("pem-map-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMapOpen]);

  useEffect(() => {
    if (!(locked && isDesktop)) return undefined;
    document.body.classList.add("pem-catalog-locked");
    return () => document.body.classList.remove("pem-catalog-locked");
  }, [locked, isDesktop]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        location: filters.location || "",
        type: filters.type || "",
        minPrice: filters.minPrice ?? "",
        maxPrice: filters.maxPrice ?? "",
        minBeds: filters.minBeds ?? "",
        minBaths: filters.minBaths ?? "",
        checkIn: filters.checkIn || "",
        checkOut: filters.checkOut || "",
      }),
    [filters],
  );

  const fetchPins = useCallback(
    async (nextBounds) => {
      if (!nextBounds) return;
      const seq = ++seqRef.current;
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const qs = buildQueryFromFilters(filters, nextBounds);
        const res = await fetch(`/api/properties/map?${qs.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (seq !== seqRef.current) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Could not load map stays");
        }
        setPins(Array.isArray(data.pins) ? data.pins : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (seq !== seqRef.current) return;
        setError(err.message || "Could not load map stays");
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    if (!bounds) return undefined;
    const timer = window.setTimeout(() => {
      void fetchPins(bounds);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps -- refetch on filter change using latest bounds

  const handleBoundsChange = useCallback(
    (payload) => {
      const next = {
        north: payload.north,
        south: payload.south,
        east: payload.east,
        west: payload.west,
      };
      setBounds(next);
      void fetchPins(next);
    },
    [fetchPins],
  );

  const handleSelect = useCallback((id) => {
    setSelectedId(String(id));
    const el = cardRefs.current.get(String(id));
    el?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, []);

  const listProperties = useMemo(() => {
    if (pins.length) return pins.map(pinToCardProperty);
    return (initialProperties || []).filter(
      (p) =>
        Number.isFinite(Number(p?.location?.lat)) &&
        Number.isFinite(Number(p?.location?.lng)),
    );
  }, [pins, initialProperties]);

  const selectedPin = pins.find((p) => p.id === String(selectedId));
  const useLockedGrid = locked && !compact;

  const listColumn = (
    <div
      className={
        useLockedGrid ? "pem-catalog-shell__list" : "pem-explore__list"
      }
      aria-live="polite"
    >
      {listHeader}
      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <p className="pem-explore__count">
        {`${listProperties.length} stay${listProperties.length === 1 ? "" : "s"} in view`}
      </p>
      <div
        className={
          useLockedGrid
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"
        }
      >
        {listProperties.map((property) => {
          const id = String(property._id);
          const selected = selectedId === id;
          return (
            <div
              key={id}
              ref={(node) => {
                if (node) cardRefs.current.set(id, node);
                else cardRefs.current.delete(id);
              }}
              className={`rounded-2xl transition ring-offset-2 ${
                selected ? "ring-2 ring-[var(--kama-accent)]" : "ring-0"
              }`}
              onMouseEnter={() => setSelectedId(id)}
              onFocus={() => setSelectedId(id)}
              onClick={() => setSelectedId(id)}
            >
              <PropertyCard property={property} />
            </div>
          );
        })}
      </div>
      {!loading && listProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--kama-border)] bg-white/70 px-4 py-10 text-center">
          <p className="font-semibold text-[var(--kama-ink)]">
            No stays found in this area
          </p>
          <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
            Zoom out on the map or clear filters.
          </p>
        </div>
      ) : null}
    </div>
  );

  const mapColumn = (
    <div
      className={
        useLockedGrid
          ? "pem-catalog-shell__map pem-explore__map hidden md:flex"
          : "pem-explore__map hidden md:block"
      }
    >
      <div className="pem-explore__map-panel">
        {isDesktop ? (
          <PropertyExploreMap
            pins={pins}
            selectedId={selectedId}
            onSelect={handleSelect}
            onBoundsChange={handleBoundsChange}
            loading={loading}
          />
        ) : (
          <div className="h-full min-h-[28rem] rounded-[1.25rem] bg-[#e8eef0]" />
        )}
        {selectedPin ? (
          <div className="pem-preview">
            <button
              type="button"
              className="pem-preview__close"
              aria-label="Clear selection"
              onClick={() => setSelectedId(null)}
            >
              <X className="h-4 w-4" />
            </button>
            {selectedPin.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPin.thumbnail}
                alt=""
                className="pem-preview__img"
              />
            ) : (
              <div className="pem-preview__img pem-preview__img--empty" />
            )}
            <div className="pem-preview__body">
              <p className="pem-preview__title">{selectedPin.title}</p>
              <p className="pem-preview__meta">
                {[selectedPin.city, selectedPin.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="pem-preview__price">
                {selectedPin.priceUsd != null
                  ? formatListingPrice(
                      selectedPin.priceUsd,
                      rates,
                      currencyCode,
                    )
                  : "—"}
                <span> / night</span>
              </p>
              <Link
                href={propertyPublicPath(selectedPin)}
                className="pem-preview__link"
              >
                View stay
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const mobileSheet =
    mobileMapOpen && !isDesktop && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pem-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Map view"
          >
            <div className="pem-mobile-sheet__bar">
              <button
                type="button"
                className="pem-explore__map-toggle"
                onClick={() => setMobileMapOpen(false)}
              >
                <List className="h-4 w-4" aria-hidden />
                List
              </button>
            </div>
            <PropertyExploreMap
              pins={pins}
              selectedId={selectedId}
              onSelect={handleSelect}
              onBoundsChange={handleBoundsChange}
              loading={loading}
              className="pem-mobile-sheet__map"
            />
            {selectedPin ? (
              <Link
                href={propertyPublicPath(selectedPin)}
                className="pem-mobile-sheet__card"
              >
                {selectedPin.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPin.thumbnail}
                    alt=""
                    className="pem-mobile-sheet__card-img"
                  />
                ) : (
                  <div className="pem-mobile-sheet__card-img" />
                )}
                <div className="pem-mobile-sheet__card-body">
                  <p className="pem-mobile-sheet__card-title">
                    {selectedPin.title}
                  </p>
                  <p className="pem-mobile-sheet__card-meta">
                    {[selectedPin.city, selectedPin.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="pem-mobile-sheet__card-price">
                    {selectedPin.priceUsd != null
                      ? formatListingPrice(
                          selectedPin.priceUsd,
                          rates,
                          currencyCode,
                        )
                      : "View stay"}
                    {selectedPin.priceUsd != null ? (
                      <span> / night</span>
                    ) : null}
                  </p>
                </div>
              </Link>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  if (useLockedGrid) {
    return (
      <div className="pem-catalog-shell pem-catalog-shell--locked">
        {!mobileMapOpen ? (
          <button
            type="button"
            className="pem-explore__fab md:hidden"
            onClick={() => setMobileMapOpen(true)}
          >
            <MapIcon className="h-4 w-4" aria-hidden />
            Map
          </button>
        ) : null}
        <div className="pem-explore pem-explore--locked">
          <div className="pem-explore__split">
            {listColumn}
            {mapColumn}
          </div>
        </div>
        {mobileSheet}
      </div>
    );
  }

  return (
    <div className={`pem-explore ${compact ? "pem-explore--compact" : ""}`}>
      {!mobileMapOpen ? (
        <button
          type="button"
          className="pem-explore__fab md:hidden"
          onClick={() => setMobileMapOpen(true)}
        >
          <MapIcon className="h-4 w-4" aria-hidden />
          Map
        </button>
      ) : null}

      <div className="pem-explore__split">
        {listColumn}
        {mapColumn}
      </div>

      {mobileSheet}
    </div>
  );
}
