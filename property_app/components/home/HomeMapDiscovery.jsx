"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import {
  MapPin,
  Search,
  RefreshCw,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import PropertyExploreMap from "@/components/maps/PropertyExploreMap";
import HomeDiscoverySearchCard from "@/components/home/HomeDiscoverySearchCard";
import HomePropertyPreviewModal, {
  captureCardFlipState,
} from "@/components/home/HomePropertyPreviewModal";
import { toUserFacingError } from "@/utils/userFacingError";
import { useHomeDiscovery } from "@/components/home/HomeDiscoveryContext";
import {
  captureSearchShellFlipState,
  prefersReducedMotion,
  runDiscoveryResultsEnter,
  runSearchShellCollapse,
  runSearchShellExpand,
} from "@/utils/animations/homeDiscovery";
import { useLanguage } from "@/components/i18n/LanguageProvider";
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
  if (filters.guests) params.set("guests", String(filters.guests));
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
 * Search pill expands into a map-dominant shell (Flip) with floating widgets.
 * Price markers open the property preview modal directly.
 */
export default function HomeMapDiscovery({ seedProperties = [] }) {
  const { t } = useLanguage();
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

  const [location, setLocation] = useState(filters.location || "");
  const [checkIn, setCheckIn] = useState(filters.checkIn || "");
  const [checkOut, setCheckOut] = useState(filters.checkOut || "");
  const [guests, setGuests] = useState(
    filters.guests != null ? Number(filters.guests) || 1 : 1,
  );

  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [previewSeed, setPreviewSeed] = useState(null);
  const previewRectRef = useRef(null);

  const abortRef = useRef(null);
  const seqRef = useRef(0);
  const cardRefs = useRef(new Map());
  const shellRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const prevSearched = useRef(hasSearched);
  const animCleanup = useRef(null);
  const pendingFlip = useRef(null);
  const shellMounted = useRef(false);

  useEffect(() => {
    setLocation(filters.location || "");
    setCheckIn(filters.checkIn || "");
    setCheckOut(filters.checkOut || "");
    if (filters.guests != null) setGuests(Number(filters.guests) || 1);
  }, [filters.location, filters.checkIn, filters.checkOut, filters.guests]);

  useLayoutEffect(() => {
    if (!shellMounted.current) {
      shellMounted.current = true;
      // URL boot may already expand via applySearch — mount the map.
      if (searchExpanded) setMapReady(true);
      return undefined;
    }

    const shellEl = shellRef.current;
    const flipState = pendingFlip.current;
    pendingFlip.current = null;
    if (!shellEl) return undefined;

    animCleanup.current?.();
    if (searchExpanded) {
      setMapReady(true);
      animCleanup.current = runSearchShellExpand({
        shellEl,
        flipState,
        onComplete: () => inputRef.current?.focus?.(),
      });
    } else {
      animCleanup.current = runSearchShellCollapse({
        shellEl,
        flipState,
      });
    }
    return () => animCleanup.current?.();
  }, [searchExpanded]);

  // Deep-link / applySearch can expand without openSearchShell.
  useEffect(() => {
    if (searchExpanded) setMapReady(true);
  }, [searchExpanded]);

  const openSearchShell = useCallback(() => {
    pendingFlip.current = captureSearchShellFlipState(shellRef.current);
    setMapReady(true);
    expandSearch();
    // Flush map to the top edge (no scroll-margin cream strip under status bar).
    requestAnimationFrame(() => {
      const el = document.getElementById("discover");
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
  }, [expandSearch]);

  const closeSearchShell = useCallback(() => {
    const shellEl = shellRef.current;
    const map = shellEl?.querySelector?.("[data-search-shell-map]");
    const widgets = shellEl?.querySelector?.("[data-search-shell-widgets]");

    const finish = () => {
      pendingFlip.current = captureSearchShellFlipState(shellEl);
      collapseSearch();
    };

    if (!prefersReducedMotion() && (map || widgets)) {
      gsap.to([map, widgets].filter(Boolean), {
        opacity: 0,
        y: 6,
        duration: 0.16,
        ease: "power1.in",
        stagger: 0.02,
        onComplete: finish,
      });
      return;
    }
    finish();
  }, [collapseSearch]);

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
        guests: filters.guests ?? "",
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
        setError(toUserFacingError(err, "Could not load map stays"));
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => () => abortRef.current?.abort?.(), []);

  useEffect(() => {
    if (!bounds || !mapReady) return undefined;
    const timer = window.setTimeout(() => void fetchPins(bounds), 0);
    return () => window.clearTimeout(timer);
  }, [filterKey, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prevSearched.current === hasSearched) return;
    prevSearched.current = hasSearched;
    if (!hasSearched) return;
    requestAnimationFrame(() => {
      runDiscoveryResultsEnter({ listEl: listRef.current });
    });
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
      if (mapReady) void fetchPins(next);
    },
    [fetchPins, mapReady],
  );

  const openPropertyPreview = useCallback(
    (property, cardEl) => {
      const id = String(property?._id || property?.id || "");
      if (!id) return;
      setSelectedPropertyId(id);
      previewRectRef.current = captureCardFlipState(cardEl);
      setPreviewSeed({
        id,
        name: property.name || property.title,
        type: property.type,
        city: property.location?.city || property.city,
        country: property.location?.country || property.country,
        beds: property.beds,
        baths: property.baths,
        listingPrice:
          property.listingPrice ??
          property.rates?.nightly ??
          property.priceUsd ??
          null,
        images: property.images?.length
          ? property.images
          : property.thumbnail
            ? [property.thumbnail]
            : [],
      });
      setPreviewId(id);
    },
    [setSelectedPropertyId],
  );

  const handleSelect = useCallback(
    (id) => {
      const pin = pins.find((p) => String(p.id) === String(id));
      if (!pin) return;
      const cardEl = cardRefs.current.get(String(pin.id));
      openPropertyPreview(pinToCardProperty(pin), cardEl || null);
    },
    [pins, openPropertyPreview],
  );

  const closePropertyPreview = useCallback(() => {
    setPreviewId(null);
    setPreviewSeed(null);
    previewRectRef.current = null;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    applySearch({
      location: location.trim(),
      type: filters.type || "",
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minBeds: filters.minBeds,
      minBaths: filters.minBaths,
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      guests: Math.max(1, Number(guests) || 1),
    });
  };

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

  const title = filters.location
    ? `Stays in ${filters.location}`
    : hasSearched
      ? "Stays in view"
      : "Discover stays";
  const triggerLabel =
    location.trim() || filters.location || t("search.whereToPh");

  return (
    <section
      id="discover"
      className={`home-map-discovery${
        searchExpanded ? " home-map-discovery--expanded" : ""
      }`}
      aria-label="Search discovery"
    >
      <div
        ref={shellRef}
        className={`home-search-shell ${
          searchExpanded
            ? "home-search-shell--expanded"
            : "home-search-shell--compact"
        }`}
        data-home-search-shell
      >
        {/* Compact face — the button */}
        <button
          type="button"
          className="home-search-shell__trigger"
          onClick={openSearchShell}
          aria-expanded={searchExpanded}
          hidden={searchExpanded}
        >
          <MapPin
            className="h-4 w-4 shrink-0 text-[var(--portal-accent)]"
            aria-hidden
          />
          <span className="home-search-shell__trigger-copy">
            <span className="home-search-shell__trigger-label">
              {t("search.whereTo")}
            </span>
            <span className="home-search-shell__trigger-value">
              {triggerLabel}
            </span>
          </span>
          <span className="home-search-shell__trigger-cta" aria-hidden>
            <Search className="h-3.5 w-3.5" />
          </span>
        </button>

        {/* Expanded body — tall map + floating search card */}
        <div className="home-search-shell__panel" aria-hidden={!searchExpanded}>
          <div className="home-search-shell__map" data-search-shell-map>
            {mapReady ? (
              <PropertyExploreMap
                pins={pins}
                selectedId={selectedPropertyId}
                onSelect={handleSelect}
                onBoundsChange={handleBoundsChange}
                loading={loading}
                className="home-search-shell__map-el"
              />
            ) : null}
          </div>

          <HomeDiscoverySearchCard
            location={location}
            onLocationChange={setLocation}
            inputRef={inputRef}
            checkIn={checkIn}
            checkOut={checkOut}
            onDatesChange={({ checkIn: nextIn, checkOut: nextOut }) => {
              setCheckIn(nextIn || "");
              setCheckOut(nextOut || "");
            }}
            guests={guests}
            onGuestsChange={setGuests}
            onClose={closeSearchShell}
            onSubmit={handleSubmit}
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
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--kama-field)] px-3 py-2">
            <p className="text-sm text-[var(--kama-ink-muted)]">
              Stays didn&apos;t load
            </p>
            <button
              type="button"
              onClick={() => bounds && void fetchPins(bounds)}
              disabled={loading || !bounds}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--kama-accent)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
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
              >
                <PropertyCard
                  property={property}
                  onPreview={openPropertyPreview}
                />
              </div>
            );
          })}
        </div>

        {!loading && listProperties.length === 0 && hasSearched ? (
          <div className="home-discovery-list__empty">
            <p className="font-semibold text-[var(--kama-ink)]">
              No stays found in this area
            </p>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              Open search and explore the map to find stays.
            </p>
          </div>
        ) : null}
      </div>

      {previewId ? (
        <HomePropertyPreviewModal
          propertyId={previewId}
          seed={previewSeed}
          sourceRect={previewRectRef.current}
          onClose={closePropertyPreview}
        />
      ) : null}
    </section>
  );
}
