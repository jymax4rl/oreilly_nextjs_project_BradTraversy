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
  X,
  ChevronDown,
  Home,
  RefreshCw,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import PropertyExploreMap from "@/components/maps/PropertyExploreMap";
import LocationSuggestInput from "@/components/search/LocationSuggestInput";
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
import {
  PROPERTY_TYPE_VALUES,
  propertyTypeMessageKey,
} from "@/lib/i18n/messages";
import "@/components/maps/property-explore-map.css";

const PROPERTY_TYPES = PROPERTY_TYPE_VALUES;

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
  const [propertyType, setPropertyType] = useState(
    filters.type || "All Properties",
  );
  const [typeOpen, setTypeOpen] = useState(false);

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
  const typeRef = useRef(null);
  const prevSearched = useRef(hasSearched);
  const animCleanup = useRef(null);
  const pendingFlip = useRef(null);
  const shellMounted = useRef(false);

  useEffect(() => {
    setLocation(filters.location || "");
    setPropertyType(filters.type || "All Properties");
  }, [filters.location, filters.type]);

  useEffect(() => {
    const onDoc = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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
        onComplete: () => setTypeOpen(false),
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
      type: propertyType,
      minPrice: null,
      maxPrice: null,
      minBeds: null,
      minBaths: null,
      checkIn: "",
      checkOut: "",
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
    location.trim() || filters.location || t("search.locationPlaceholder");

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
              {t("search.location")}
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

          <form
            className="home-search-shell__widgets"
            data-search-shell-widgets
            role="search"
            aria-label={t("search.aria")}
            onSubmit={handleSubmit}
          >
            <div className="home-search-shell__row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t("search.location")}</span>
                <LocationSuggestInput
                  inputRef={inputRef}
                  value={location}
                  onChange={setLocation}
                  placeholder={t("search.locationPlaceholder")}
                  className="home-search-field w-full rounded-xl py-2.5 pl-9 pr-3 text-[14px] outline-none"
                />
              </label>

              <div className="home-search-shell__type relative w-[9.5rem] shrink-0" ref={typeRef}>
                <Home
                  className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
                  aria-hidden
                />
                <button
                  type="button"
                  className="home-search-field flex min-h-[42px] w-full items-center justify-between rounded-xl py-2.5 pl-8 pr-2 text-left text-[13px]"
                  aria-haspopup="listbox"
                  aria-expanded={typeOpen}
                  onClick={() => setTypeOpen((o) => !o)}
                >
                  <span className="block truncate">
                    {t(propertyTypeMessageKey(propertyType))}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${typeOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {typeOpen ? (
                  <ul
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--portal-border)] bg-white py-1 shadow-xl"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <li key={type} role="option" aria-selected={propertyType === type}>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm ${
                            propertyType === type
                              ? "bg-[var(--portal-accent-soft)] text-[var(--portal-accent)]"
                              : "hover:bg-[var(--portal-field)]"
                          }`}
                          onClick={() => {
                            setPropertyType(type);
                            setTypeOpen(false);
                          }}
                        >
                          {t(propertyTypeMessageKey(type))}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="home-search-shell__actions">
              <button
                type="button"
                className="home-search-shell__close"
                aria-label="Close"
                onClick={closeSearchShell}
              >
                <X className="h-4 w-4" />
              </button>
              <button type="submit" className="home-search-cta home-search-shell__submit">
                <Search className="h-4 w-4" aria-hidden />
                {t("search.search")}
              </button>
            </div>
          </form>
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
