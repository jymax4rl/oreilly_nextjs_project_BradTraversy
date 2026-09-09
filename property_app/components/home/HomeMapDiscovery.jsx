"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PropertyExploreMap from "@/components/maps/PropertyExploreMap";
import HomePortalSearch from "@/components/home/HomePortalSearch";
import { useHomeDiscovery } from "@/components/home/HomeDiscoveryContext";
import { runDiscoveryResultsEnter } from "@/utils/animations/homeDiscovery";
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
 * Compact map discovery: ~30–40vh map + search overlay + results below.
 * Not a side-by-side dashboard.
 */
export default function HomeMapDiscovery({ seedProperties = [] }) {
  const {
    filters,
    searchExpanded,
    hasSearched,
    selectedPropertyId,
    expandSearch,
    collapseSearch,
    applySearch,
    clearSearch,
    setSelectedPropertyId,
  } = useHomeDiscovery();
  const { currencyCode, rates } = useCurrency();

  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bounds, setBounds] = useState(null);
  const abortRef = useRef(null);
  const seqRef = useRef(0);
  const cardRefs = useRef(new Map());
  const mapStageRef = useRef(null);
  const listRef = useRef(null);
  const prevSearched = useRef(hasSearched);
  const animCleanup = useRef(null);

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

  useEffect(() => () => abortRef.current?.abort?.(), []);

  useEffect(() => {
    if (!bounds) return undefined;
    const timer = window.setTimeout(() => {
      void fetchPins(bounds);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prevSearched.current === hasSearched) return;
    prevSearched.current = hasSearched;
    if (!hasSearched) return;
    animCleanup.current?.();
    requestAnimationFrame(() => {
      animCleanup.current = runDiscoveryResultsEnter({
        mapStageEl: mapStageRef.current,
        listEl: listRef.current,
      });
    });
    return () => animCleanup.current?.();
  }, [hasSearched]);

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

  const handleSelect = useCallback(
    (id) => {
      const sid = String(id);
      setSelectedPropertyId(sid);
      cardRefs.current
        .get(sid)
        ?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    },
    [setSelectedPropertyId],
  );

  const listProperties = useMemo(() => {
    if (pins.length) return pins.map(pinToCardProperty);
    if (!hasSearched && seedProperties?.length) {
      return seedProperties.filter(
        (p) =>
          Number.isFinite(Number(p?.location?.lat)) &&
          Number.isFinite(Number(p?.location?.lng)),
      );
    }
    return [];
  }, [pins, seedProperties, hasSearched]);

  const selectedPin = pins.find((p) => p.id === String(selectedPropertyId));
  const title = filters.location
    ? `Stays in ${filters.location}`
    : hasSearched
      ? "Stays in view"
      : "Discover stays";

  return (
    <section
      id="discover"
      className="home-map-discovery"
      aria-label="Map discovery"
    >
      <div
        ref={mapStageRef}
        className={`home-map-stage${searchExpanded ? " home-map-stage--searching" : ""}`}
        data-home-map-stage
      >
        <div className="home-map-stage__frame">
          <PropertyExploreMap
            pins={pins}
            selectedId={selectedPropertyId}
            onSelect={handleSelect}
            onBoundsChange={handleBoundsChange}
            loading={loading}
            className="home-map-stage__map"
          />
          {selectedPin ? (
            <Link
              href={propertyPublicPath(selectedPin)}
              className="home-map-preview"
            >
              {selectedPin.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPin.thumbnail}
                  alt=""
                  className="home-map-preview__img"
                />
              ) : (
                <div className="home-map-preview__img home-map-preview__img--empty" />
              )}
              <div className="home-map-preview__body">
                <p className="home-map-preview__title">{selectedPin.title}</p>
                <p className="home-map-preview__meta">
                  {[selectedPin.city, selectedPin.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="home-map-preview__price">
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
        </div>

        <div className="home-search-overlay">
          <HomePortalSearch
            variant="overlay"
            expanded={searchExpanded}
            onExpandRequest={expandSearch}
            onCollapseRequest={collapseSearch}
            onSearch={applySearch}
            initialFilters={filters}
          />
        </div>
      </div>

      <div
        ref={listRef}
        className="home-discovery-list"
        data-home-discovery-list
      >
        <div className="home-discovery-list__chrome">
          <div>
            <h2 className="home-discovery-list__title">{title}</h2>
            <p className="home-discovery-list__count">
              {loading
                ? "Updating stays…"
                : `${listProperties.length} stay${listProperties.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {hasSearched ? (
            <button
              type="button"
              onClick={clearSearch}
              className="home-discovery-list__clear"
            >
              Clear
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="home-discovery-list__grid">
          {listProperties.map((property) => {
            const id = String(property._id);
            const selected = selectedPropertyId === id;
            return (
              <div
                key={id}
                data-discovery-card
                ref={(node) => {
                  if (node) cardRefs.current.set(id, node);
                  else cardRefs.current.delete(id);
                }}
                className={`rounded-2xl transition ring-offset-2 ${
                  selected ? "ring-2 ring-[var(--kama-accent)]" : "ring-0"
                }`}
                onMouseEnter={() => setSelectedPropertyId(id)}
                onFocus={() => setSelectedPropertyId(id)}
                onClick={() => setSelectedPropertyId(id)}
              >
                <PropertyCard property={property} />
              </div>
            );
          })}
        </div>

        {!loading && listProperties.length === 0 ? (
          <div className="home-discovery-list__empty">
            <p className="font-semibold text-[var(--kama-ink)]">
              No stays found in this area
            </p>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              Move the map or clear filters to discover more.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
