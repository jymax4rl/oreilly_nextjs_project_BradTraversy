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
  SlidersHorizontal,
} from "lucide-react";
import Currency from "@/components/Currency";

const PROPERTY_TYPES = [
  "All Properties",
  "Apartment",
  "Studio",
  "Condo",
  "House",
  "Cabin or Cottage",
  "Loft",
  "Room",
  "Other",
];

const MIN_COUNT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

function PriceFields({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="min-w-0">
        <span className="sr-only">Minimum price per night</span>
        <input
          type="number"
          name="minPrice"
          min={0}
          inputMode="numeric"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min $/night"
          className="home-search-field w-full rounded-2xl px-3 py-2.5 text-[14px] outline-none transition sm:py-3 sm:text-[15px]"
        />
      </label>
      <label className="min-w-0">
        <span className="sr-only">Maximum price per night</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max $/night"
          className="home-search-field w-full rounded-2xl px-3 py-2.5 text-[14px] outline-none transition sm:py-3 sm:text-[15px]"
        />
      </label>
    </div>
  );
}

function RoomFields({ minBeds, minBaths, setMinBeds, setMinBaths }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="relative min-w-0">
        <span className="sr-only">Minimum bedrooms</span>
        <BedDouble
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
          aria-hidden
        />
        <select
          name="minBeds"
          value={minBeds}
          onChange={(e) => setMinBeds(e.target.value)}
          className="home-search-field w-full rounded-2xl py-2.5 pl-9 text-[14px] outline-none transition sm:py-3 sm:pl-10 sm:text-[15px]"
          aria-label="Minimum bedrooms"
        >
          {MIN_COUNT_OPTIONS.map((opt) => (
            <option key={`beds-${opt.value || "any"}`} value={opt.value}>
              {opt.value ? `${opt.label} beds` : "Beds"}
            </option>
          ))}
        </select>
      </label>
      <label className="relative min-w-0">
        <span className="sr-only">Minimum bathrooms</span>
        <Bath
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)]"
          aria-hidden
        />
        <select
          name="minBaths"
          value={minBaths}
          onChange={(e) => setMinBaths(e.target.value)}
          className="home-search-field w-full rounded-2xl py-2.5 pl-9 text-[14px] outline-none transition sm:py-3 sm:pl-10 sm:text-[15px]"
          aria-label="Minimum bathrooms"
        >
          {MIN_COUNT_OPTIONS.map((opt) => (
            <option key={`baths-${opt.value || "any"}`} value={opt.value}>
              {opt.value ? `${opt.label} baths` : "Baths"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/**
 * Airy home search: location + type first; price/beds/baths behind Filters on mobile.
 * Desktop keeps filters inline with more room.
 */
export default function HomePortalSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("All Properties");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFilterCount = [
    minPrice.trim(),
    maxPrice.trim(),
    minBeds,
    minBaths,
  ].filter(Boolean).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (propertyType && propertyType !== "All Properties") {
      params.set("type", propertyType);
    }
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (minBeds) params.set("minBeds", minBeds);
    if (minBaths) params.set("minBaths", minBaths);
    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);
    router.refresh();
  };

  const fieldClass =
    "home-search-field w-full rounded-2xl py-2.5 pl-10 pr-3 text-[14px] outline-none transition sm:py-3 sm:pl-11 sm:text-[15px]";

  return (
    <form
      role="search"
      aria-label="Search vacation rentals"
      onSubmit={handleSubmit}
      className="home-glass-search mx-auto w-full max-w-xl rounded-[1.5rem] px-5 py-6 sm:max-w-2xl sm:px-6 sm:py-7 lg:max-w-5xl lg:px-7 lg:py-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <p className="text-left text-[12px] font-medium tracking-wide text-[var(--portal-ink-muted)]">
          Find a stay
        </p>
        <Currency variant="portal" />
      </div>

      <div className="flex flex-col gap-4 lg:gap-3.5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
          <label className="relative min-w-0 flex-1 lg:flex-[2.2]">
            <span className="sr-only">Location</span>
            <MapPin
              className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-accent)] sm:h-4 sm:w-4"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country, neighborhood…"
              autoComplete="off"
              enterKeyHint="search"
              className={fieldClass}
            />
          </label>

          <div
            className="relative min-w-0 lg:w-[12.5rem] lg:flex-none"
            ref={dropdownRef}
          >
            <span className="sr-only">Property type</span>
            <Home
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-ink-muted)] sm:h-4 sm:w-4"
              aria-hidden
            />
            <button
              type="button"
              className="home-type-trigger home-search-field flex min-h-[42px] w-full items-center justify-between rounded-2xl py-2.5 pl-10 pr-3 text-left text-[14px] transition sm:min-h-[44px] sm:py-3 sm:pl-11 sm:text-[15px]"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen((o) => !o)}
            >
              <span className="block truncate">{propertyType}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[var(--portal-ink-muted)] transition-transform sm:h-4 sm:w-4 ${isDropdownOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {isDropdownOpen && (
              <ul
                role="listbox"
                aria-label="Property types"
                className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-[var(--portal-border)] bg-white py-1 shadow-xl"
              >
                {PROPERTY_TYPES.map((type) => (
                  <li
                    key={type}
                    role="option"
                    aria-selected={propertyType === type}
                  >
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition ${
                        propertyType === type
                          ? "bg-[var(--portal-accent-soft)] font-medium text-[var(--portal-accent)]"
                          : "text-[var(--portal-ink)] hover:bg-[var(--portal-field)]"
                      }`}
                      onClick={() => {
                        setPropertyType(type);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mobile: progressive disclosure */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--portal-border)] bg-transparent px-3.5 py-2 text-[13px] font-medium text-[var(--portal-ink-muted)] transition hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-accent)]"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--portal-accent-soft)] px-1.5 text-[11px] font-semibold text-[var(--portal-accent)]">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {filtersOpen ? (
            <div className="mt-4 flex flex-col gap-3.5">
              <PriceFields
                minPrice={minPrice}
                maxPrice={maxPrice}
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
              />
              <RoomFields
                minBeds={minBeds}
                minBaths={minBaths}
                setMinBeds={setMinBeds}
                setMinBaths={setMinBaths}
              />
            </div>
          ) : null}
        </div>

        {/* Desktop: filters + search inline */}
        <div className="hidden lg:flex lg:flex-row lg:items-stretch lg:gap-3">
          <div className="min-w-0 flex-1">
            <PriceFields
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
            />
          </div>
          <div className="w-[17rem] flex-none">
            <RoomFields
              minBeds={minBeds}
              minBaths={minBaths}
              setMinBeds={setMinBeds}
              setMinBaths={setMinBaths}
            />
          </div>
          <button
            type="submit"
            className="home-search-cta inline-flex min-h-[44px] min-w-[8.5rem] items-center justify-center gap-2 rounded-2xl px-6 text-[15px] font-semibold transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portal-accent)]"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search
          </button>
        </div>

        <button
          type="submit"
          className="home-search-cta mt-1 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-[15px] font-semibold transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portal-accent)] lg:hidden"
        >
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </div>
    </form>
  );
}
