"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Home,
  Search,
  ChevronDown,
  BedDouble,
  Bath,
  X,
} from "lucide-react";
import Currency from "@/components/Currency";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  PROPERTY_TYPE_VALUES,
  propertyTypeMessageKey,
} from "@/lib/i18n/messages";
import PriceRangeSlider from "@/components/search/PriceRangeSlider";
import {
  runSearchCollapseTransition,
  runSearchExpandTransition,
} from "@/utils/animations/homeDiscovery";

const PROPERTY_TYPES = PROPERTY_TYPE_VALUES;

const MIN_COUNT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

function ThinPriceField({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  setPriceTouched,
  t,
}) {
  return (
    <div className="home-search-price">
      <p className="home-search-price__label">
        {t("search.perNight")} (USD)
      </p>
      <PriceRangeSlider
        min={0}
        max={1000}
        step={10}
        valueMin={Number(minPrice) || 0}
        valueMax={Number(maxPrice) || 1000}
        onChange={({ min, max }) => {
          setMinPrice(String(min));
          setMaxPrice(String(max));
          setPriceTouched?.(true);
        }}
      />
    </div>
  );
}

function RoomFields({ minBeds, minBaths, setMinBeds, setMinBaths, t }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="relative min-w-0">
        <span className="sr-only">{t("search.minBeds")}</span>
        <BedDouble
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
          aria-hidden
        />
        <select
          name="minBeds"
          value={minBeds}
          onChange={(e) => setMinBeds(e.target.value)}
          className="home-search-field w-full rounded-xl py-2.5 pl-9 text-[13px] outline-none"
          aria-label={t("search.minBeds")}
        >
          {MIN_COUNT_OPTIONS.map((opt) => (
            <option key={`beds-${opt.value || "any"}`} value={opt.value}>
              {opt.value
                ? t("search.bedsN", { n: opt.label.replace("+", "") })
                : t("search.beds")}
            </option>
          ))}
        </select>
      </label>
      <label className="relative min-w-0">
        <span className="sr-only">{t("search.minBaths")}</span>
        <Bath
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
          aria-hidden
        />
        <select
          name="minBaths"
          value={minBaths}
          onChange={(e) => setMinBaths(e.target.value)}
          className="home-search-field w-full rounded-xl py-2.5 pl-9 text-[13px] outline-none"
          aria-label={t("search.minBaths")}
        >
          {MIN_COUNT_OPTIONS.map((opt) => (
            <option key={`baths-${opt.value || "any"}`} value={opt.value}>
              {opt.value
                ? t("search.bathsN", { n: opt.label.replace("+", "") })
                : t("search.baths")}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function seedFromUrlOrProps(initialFilters) {
  if (initialFilters?.location || initialFilters?.type) return initialFilters;
  if (typeof window === "undefined") return initialFilters;
  const params = new URLSearchParams(window.location.search);
  const location = params.get("location") || "";
  const type = params.get("type") || "";
  if (!location && !type && !params.get("discover")) return initialFilters;
  return {
    location,
    type: type || "All Properties",
    minPrice: params.get("minPrice"),
    maxPrice: params.get("maxPrice"),
    minBeds: params.get("minBeds") || "",
    minBaths: params.get("minBaths") || "",
  };
}

/**
 * Homepage search card — overlay on map discovery.
 * `expanded` controls compact vs full via GSAP Flip (parent owns state).
 */
export default function HomePortalSearch({
  onSearch = null,
  initialFilters = null,
  expanded = false,
  onExpandRequest = null,
  onCollapseRequest = null,
  variant = "overlay",
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const seeded = seedFromUrlOrProps(initialFilters);
  const [location, setLocation] = useState(seeded?.location || "");
  const [propertyType, setPropertyType] = useState(
    seeded?.type || "All Properties",
  );
  const [minPrice, setMinPrice] = useState(
    seeded?.minPrice != null && seeded.minPrice !== ""
      ? String(seeded.minPrice)
      : "0",
  );
  const [maxPrice, setMaxPrice] = useState(
    seeded?.maxPrice != null && seeded.maxPrice !== ""
      ? String(seeded.maxPrice)
      : "1000",
  );
  const [priceTouched, setPriceTouched] = useState(
    Boolean(
      seeded &&
        ((seeded.minPrice != null && seeded.minPrice !== "") ||
          (seeded.maxPrice != null && seeded.maxPrice !== "")),
    ),
  );
  const [minBeds, setMinBeds] = useState(
    seeded?.minBeds != null ? String(seeded.minBeds) : "",
  );
  const [minBaths, setMinBaths] = useState(
    seeded?.minBaths != null ? String(seeded.minBaths) : "",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const cardRef = useRef(null);
  const inputRef = useRef(null);
  const prevExpanded = useRef(expanded);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (prevExpanded.current === expanded) return;
    prevExpanded.current = expanded;
    cleanupRef.current?.();
    const cardEl = cardRef.current;
    if (!cardEl) return;

    if (expanded) {
      cleanupRef.current = runSearchExpandTransition({ cardEl });
      requestAnimationFrame(() => inputRef.current?.focus?.());
    } else {
      cleanupRef.current = runSearchCollapseTransition({ cardEl });
    }

    return () => cleanupRef.current?.();
  }, [expanded]);

  const activeFilterCount = [
    priceTouched ? "1" : "",
    minBeds,
    minBaths,
  ].filter(Boolean).length;

  const buildFilters = () => {
    const next = {
      location: location.trim(),
      type: propertyType,
      minPrice: null,
      maxPrice: null,
      minBeds: minBeds || null,
      minBaths: minBaths || null,
      checkIn: "",
      checkOut: "",
    };
    if (priceTouched) {
      const minN = Number(minPrice);
      const maxN = Number(maxPrice);
      if (Number.isFinite(minN) && minN > 0) next.minPrice = minN;
      if (Number.isFinite(maxN) && maxN < 1000) next.maxPrice = maxN;
    }
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = buildFilters();
    if (typeof onSearch === "function") {
      onSearch(next);
      return;
    }
    const params = new URLSearchParams();
    if (next.location) params.set("location", next.location);
    if (next.type && next.type !== "All Properties") {
      params.set("type", next.type);
    }
    if (next.minPrice != null) params.set("minPrice", String(next.minPrice));
    if (next.maxPrice != null) params.set("maxPrice", String(next.maxPrice));
    if (next.minBeds) params.set("minBeds", String(next.minBeds));
    if (next.minBaths) params.set("minBaths", String(next.minBaths));
    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);
    router.refresh();
  };

  const isOverlay = variant === "overlay";
  const compact = isOverlay && !expanded;

  return (
    <form
      ref={cardRef}
      role="search"
      aria-label={t("search.aria")}
      onSubmit={handleSubmit}
      data-home-search-card
      className={`home-search-card ${
        compact ? "home-search-card--compact" : "home-search-card--expanded"
      }${isOverlay ? " home-search-card--overlay" : ""}`}
    >
      {compact ? (
        <button
          type="button"
          className="home-search-compact-trigger"
          onClick={() => onExpandRequest?.()}
          aria-expanded={false}
        >
          <MapPin className="h-4 w-4 shrink-0 text-[var(--portal-accent)]" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">
            {location.trim() || t("search.locationPlaceholder")}
          </span>
          <span className="home-search-compact-trigger__cta" aria-hidden>
            <Search className="h-3.5 w-3.5" />
          </span>
        </button>
      ) : (
        <>
          <div className="home-search-heading mb-3 flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium tracking-wide text-[var(--portal-ink-muted)]">
              {t("search.findStay")}
            </p>
            <div className="flex items-center gap-2">
              <Currency variant="portal" />
              {isOverlay && onCollapseRequest ? (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--portal-ink-muted)] transition hover:bg-[var(--portal-field)] hover:text-[var(--portal-ink)]"
                  aria-label="Close search"
                  onClick={() => onCollapseRequest?.()}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div
            className="home-search-body flex flex-col gap-3"
            data-search-expand-panel
          >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t("search.location")}</span>
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-accent)]"
                  aria-hidden
                />
                <input
                  ref={inputRef}
                  type="search"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("search.locationPlaceholder")}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="home-search-field w-full rounded-xl py-2.5 pl-9 pr-3 text-[14px] outline-none"
                />
              </label>

              <div className="relative min-w-0 sm:w-[11.5rem]" ref={dropdownRef}>
                <span className="sr-only">{t("search.propertyType")}</span>
                <Home
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
                  aria-hidden
                />
                <button
                  type="button"
                  className="home-type-trigger home-search-field flex min-h-[42px] w-full items-center justify-between rounded-xl py-2.5 pl-9 pr-3 text-left text-[14px]"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  onClick={() => setIsDropdownOpen((o) => !o)}
                >
                  <span className="block truncate">
                    {t(propertyTypeMessageKey(propertyType))}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-[var(--portal-ink-muted)] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isDropdownOpen ? (
                  <ul
                    role="listbox"
                    aria-label={t("search.propertyTypes")}
                    className="absolute z-50 mt-1.5 max-h-52 w-full overflow-auto rounded-xl border border-[var(--portal-border)] bg-white py-1 shadow-xl"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <li
                        key={type}
                        role="option"
                        aria-selected={propertyType === type}
                      >
                        <button
                          type="button"
                          className={`w-full px-3.5 py-2 text-left text-sm transition ${
                            propertyType === type
                              ? "bg-[var(--portal-accent-soft)] font-medium text-[var(--portal-accent)]"
                              : "text-[var(--portal-ink)] hover:bg-[var(--portal-field)]"
                          }`}
                          onClick={() => {
                            setPropertyType(type);
                            setIsDropdownOpen(false);
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

            <ThinPriceField
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              setPriceTouched={setPriceTouched}
              t={t}
            />

            <RoomFields
              minBeds={minBeds}
              minBaths={minBaths}
              setMinBeds={setMinBeds}
              setMinBaths={setMinBaths}
              t={t}
            />

            <button
              type="submit"
              className="home-search-cta inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition active:scale-[0.98]"
            >
              <Search className="h-4 w-4" aria-hidden />
              {t("search.search")}
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
