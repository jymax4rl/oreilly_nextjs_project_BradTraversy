"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Home, Search, ChevronDown, X, BedDouble, Bath } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  PROPERTY_TYPE_VALUES,
  propertyTypeMessageKey,
} from "@/lib/i18n/messages";

const PROPERTY_TYPES = PROPERTY_TYPE_VALUES;

const MIN_COUNT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const PropertySearch = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params (back-button persistence)
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("type") || "All Properties",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");
  const [minBaths, setMinBaths] = useState(searchParams.get("minBaths") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const clearSearch = () => {
    setLocation("");
    setPropertyType("All Properties");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("");
    setMinBaths("");
    inputRef.current?.focus();
  };

  const hasActiveFilters =
    location.trim() ||
    propertyType !== "All Properties" ||
    minPrice.trim() ||
    maxPrice.trim() ||
    minBeds ||
    minBaths;

  return (
    <section className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[12vh] mb-12">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
            {/* Location Input */}
            <div className="w-full md:flex-[2] relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--kama-accent)] transition-colors" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("search.locationLong")}
                className="w-full pl-12 pr-10 py-4 rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] placeholder-[var(--kama-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all duration-200 shadow-sm"
              />
              {location && (
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Property Type Dropdown */}
            <div className="w-full md:flex-[1.5] relative" ref={dropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Home className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="cursor-pointer w-full pl-12 pr-4 py-4 text-left rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all duration-200 shadow-sm flex items-center justify-between"
              >
                <span className="block truncate">{t(propertyTypeMessageKey(propertyType))}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="max-h-60 overflow-auto py-2">
                    {PROPERTY_TYPES.map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setPropertyType(type);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors text-sm flex items-center justify-between ${propertyType === type ? "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {t(propertyTypeMessageKey(type))}
                        {propertyType === type && (
                          <div className="w-2 h-2 rounded-full bg-[var(--kama-accent)]"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
            {/* Price range */}
            <div className="w-full md:flex-[1.2] grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={t("search.minNightPh")}
                className="w-full py-4 px-4 rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] placeholder-[var(--kama-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all shadow-sm"
              />
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={t("search.maxNightPh")}
                className="w-full py-4 px-4 rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] placeholder-[var(--kama-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all shadow-sm"
              />
            </div>

            {/* Beds / baths */}
            <div className="w-full md:flex-[1.2] grid grid-cols-2 gap-2">
              <div className="relative">
                <BedDouble className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                <select
                  value={minBeds}
                  onChange={(e) => setMinBeds(e.target.value)}
                  aria-label={t("search.minBeds")}
                  className="w-full appearance-none py-4 pl-10 pr-8 rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all shadow-sm"
                >
                  {MIN_COUNT_OPTIONS.map((opt) => (
                    <option key={`beds-${opt.value || "any"}`} value={opt.value}>
                      {opt.value ? t("search.bedsN", { n: opt.label.replace("+", "") }) : t("search.bedsAny")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Bath className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                <select
                  value={minBaths}
                  onChange={(e) => setMinBaths(e.target.value)}
                  aria-label={t("search.minBaths")}
                  className="w-full appearance-none py-4 pl-10 pr-8 rounded-2xl bg-[var(--kama-field)] border border-[var(--kama-border)] text-[var(--kama-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20 focus:border-[var(--kama-accent)] focus:bg-white transition-all shadow-sm"
                >
                  {MIN_COUNT_OPTIONS.map((opt) => (
                    <option key={`baths-${opt.value || "any"}`} value={opt.value}>
                      {opt.value ? t("search.bathsN", { n: opt.label.replace("+", "") }) : t("search.bathsAny")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="kama-cta cursor-pointer w-full md:w-auto md:min-w-[160px] min-h-[52px] py-4 px-8 rounded-2xl font-bold shadow-lg shadow-[rgba(27,92,87,0.25)] hover:shadow-[rgba(27,92,87,0.35)] transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              <span>{t("search.search")}</span>
            </button>
          </div>
        </form>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">{t("search.activeFilters")}</span>
            {location.trim() && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] text-xs font-medium">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            {propertyType !== "All Properties" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] text-xs font-medium">
                <Home className="h-3 w-3" /> {t(propertyTypeMessageKey(propertyType))}
              </span>
            )}
            {(minPrice.trim() || maxPrice.trim()) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] text-xs font-medium">
                ${minPrice || "0"} – ${maxPrice || "∞"} {t("search.perNight")}
              </span>
            )}
            {minBeds && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] text-xs font-medium">
                <BedDouble className="h-3 w-3" /> {t("search.bedsN", { n: minBeds })}
              </span>
            )}
            {minBaths && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] text-xs font-medium">
                <Bath className="h-3 w-3" /> {t("search.bathsN", { n: minBaths })}
              </span>
            )}
            <button
              type="button"
              onClick={clearSearch}
              className="text-red-500 hover:text-red-700 underline underline-offset-2 text-xs font-medium md:ml-auto"
            >
              {t("search.clear")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertySearch;
