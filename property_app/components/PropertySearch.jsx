"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Home, Search, ChevronDown, X, BedDouble, Bath } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  PROPERTY_TYPE_VALUES,
  propertyTypeMessageKey,
} from "@/lib/i18n/messages";
import PriceRangeSlider from "@/components/search/PriceRangeSlider";
import LocationSuggestInput from "@/components/search/LocationSuggestInput";

const PROPERTY_TYPES = PROPERTY_TYPE_VALUES;
const PRICE_SLIDER_MAX = 1000;

const MIN_COUNT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const PropertySearch = ({ variant = "default" }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCatalog = variant === "catalog";

  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("type") || "All Properties",
  );
  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0,
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : PRICE_SLIDER_MAX,
  );
  const [priceTouched, setPriceTouched] = useState(
    Boolean(searchParams.get("minPrice") || searchParams.get("maxPrice")),
  );
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");
  const [minBaths, setMinBaths] = useState(searchParams.get("minBaths") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
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
    if (priceTouched) {
      if (minPrice > 0) params.set("minPrice", String(minPrice));
      if (maxPrice < PRICE_SLIDER_MAX) params.set("maxPrice", String(maxPrice));
    }
    if (minBeds) params.set("minBeds", minBeds);
    if (minBaths) params.set("minBaths", minBaths);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);
    router.refresh();
  };

  const clearSearch = () => {
    setLocation("");
    setPropertyType("All Properties");
    setMinPrice(0);
    setMaxPrice(PRICE_SLIDER_MAX);
    setPriceTouched(false);
    setMinBeds("");
    setMinBaths("");
    setCheckIn("");
    setCheckOut("");
    inputRef.current?.focus();
  };

  const hasActiveFilters =
    location.trim() ||
    propertyType !== "All Properties" ||
    priceTouched ||
    minBeds ||
    minBaths ||
    checkIn ||
    checkOut;

  if (isCatalog) {
    return (
      <form
        onSubmit={handleSubmit}
        className="pem-catalog-search"
        role="search"
        aria-label={t("search.aria")}
      >
        <div className="pem-catalog-search__pill">
          <label className="pem-catalog-search__cell pem-catalog-search__cell--grow">
            <span className="pem-catalog-search__label">{t("search.location")}</span>
            <span className="pem-catalog-search__field">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--kama-ink-muted)]" aria-hidden />
              <LocationSuggestInput
                showIcon={false}
                inputRef={inputRef}
                value={location}
                onChange={setLocation}
                placeholder={t("search.locationPlaceholder")}
                className="pem-catalog-search__input"
              />
            </span>
          </label>

          <div className="pem-catalog-search__divider" aria-hidden />

          <label className="pem-catalog-search__cell">
            <span className="pem-catalog-search__label">Check-in</span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="pem-catalog-search__input"
            />
          </label>

          <div className="pem-catalog-search__divider" aria-hidden />

          <label className="pem-catalog-search__cell">
            <span className="pem-catalog-search__label">Check-out</span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="pem-catalog-search__input"
            />
          </label>

          <div className="pem-catalog-search__divider" aria-hidden />

          <div className="pem-catalog-search__cell" ref={dropdownRef}>
            <span className="pem-catalog-search__label">{t("search.propertyType")}</span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((o) => !o)}
              className="pem-catalog-search__type"
            >
              <span className="truncate">{t(propertyTypeMessageKey(propertyType))}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            </button>
            {isDropdownOpen ? (
              <div className="pem-catalog-search__menu">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={
                      propertyType === type
                        ? "pem-catalog-search__option pem-catalog-search__option--active"
                        : "pem-catalog-search__option"
                    }
                    onClick={() => {
                      setPropertyType(type);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {t(propertyTypeMessageKey(type))}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button type="submit" className="pem-catalog-search__submit" aria-label={t("search.search")}>
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="pem-catalog-search__filters">
          <div className="pem-catalog-search__slider">
            <PriceRangeSlider
              min={0}
              max={PRICE_SLIDER_MAX}
              step={10}
              valueMin={minPrice}
              valueMax={maxPrice}
              onChange={({ min, max }) => {
                setMinPrice(min);
                setMaxPrice(max);
                setPriceTouched(true);
              }}
            />
          </div>
          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            aria-label={t("search.minBeds")}
            className="pem-catalog-search__select"
          >
            {MIN_COUNT_OPTIONS.map((opt) => (
              <option key={`beds-${opt.value || "any"}`} value={opt.value}>
                {opt.value
                  ? t("search.bedsN", { n: opt.label.replace("+", "") })
                  : t("search.beds")}
              </option>
            ))}
          </select>
          <select
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            aria-label={t("search.minBaths")}
            className="pem-catalog-search__select"
          >
            {MIN_COUNT_OPTIONS.map((opt) => (
              <option key={`baths-${opt.value || "any"}`} value={opt.value}>
                {opt.value
                  ? t("search.bathsN", { n: opt.label.replace("+", "") })
                  : t("search.baths")}
              </option>
            ))}
          </select>
          {hasActiveFilters ? (
            <button type="button" onClick={clearSearch} className="pem-catalog-search__clear">
              {t("search.clear")}
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <section className="relative z-20 mx-auto mb-12 mt-[12vh] max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl md:p-10">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row">
            <div className="group relative w-full md:flex-[2]">
              <LocationSuggestInput
                inputRef={inputRef}
                value={location}
                onChange={setLocation}
                placeholder={t("search.locationLong")}
                className="w-full rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] py-4 pl-12 pr-10 text-[var(--kama-ink)] shadow-sm placeholder-[var(--kama-ink-muted)] transition-all duration-200 focus:border-[var(--kama-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
              />
              {location ? (
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="relative w-full md:flex-[1.5]" ref={dropdownRef}>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                <Home className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] py-4 pl-12 pr-4 text-left text-[var(--kama-ink)] shadow-sm transition-all duration-200 focus:border-[var(--kama-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
              >
                <span className="block truncate">
                  {t(propertyTypeMessageKey(propertyType))}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen ? (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  <div className="max-h-60 overflow-auto py-2">
                    {PROPERTY_TYPES.map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setPropertyType(type);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors ${propertyType === type ? "bg-[var(--kama-accent-soft)] font-medium text-[var(--kama-accent)]" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {t(propertyTypeMessageKey(type))}
                        {propertyType === type ? (
                          <div className="h-2 w-2 rounded-full bg-[var(--kama-accent)]" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-[1.35fr_1fr_0.9fr_auto] md:items-end">
            <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-4 py-3">
              <p className="mb-1 text-xs font-semibold text-[var(--kama-ink-muted)]">
                {t("search.perNight")} (USD)
              </p>
              <PriceRangeSlider
                min={0}
                max={PRICE_SLIDER_MAX}
                step={10}
                valueMin={minPrice}
                valueMax={maxPrice}
                onChange={({ min, max }) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                  setPriceTouched(true);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-[var(--kama-ink-muted)]">
                  Check-in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-3 text-sm text-[var(--kama-ink)] focus:border-[var(--kama-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-[var(--kama-ink-muted)]">
                  Check-out
                </span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-3 text-sm text-[var(--kama-ink)] focus:border-[var(--kama-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <BedDouble
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <select
                  value={minBeds}
                  onChange={(e) => setMinBeds(e.target.value)}
                  aria-label={t("search.minBeds")}
                  className="w-full appearance-none rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] py-4 pl-10 pr-8 text-[var(--kama-ink)] shadow-sm focus:border-[var(--kama-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
                >
                  {MIN_COUNT_OPTIONS.map((opt) => (
                    <option key={`beds-${opt.value || "any"}`} value={opt.value}>
                      {opt.value
                        ? t("search.bedsN", { n: opt.label.replace("+", "") })
                        : t("search.bedsAny")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Bath
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <select
                  value={minBaths}
                  onChange={(e) => setMinBaths(e.target.value)}
                  aria-label={t("search.minBaths")}
                  className="w-full appearance-none rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] py-4 pl-10 pr-8 text-[var(--kama-ink)] shadow-sm focus:border-[var(--kama-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--kama-accent)]/20"
                >
                  {MIN_COUNT_OPTIONS.map((opt) => (
                    <option key={`baths-${opt.value || "any"}`} value={opt.value}>
                      {opt.value
                        ? t("search.bathsN", { n: opt.label.replace("+", "") })
                        : t("search.bathsAny")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="kama-cta flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-8 py-4 font-bold shadow-lg shadow-[rgba(27,92,87,0.25)] transition-all duration-200 hover:shadow-[rgba(27,92,87,0.35)] active:scale-95 md:w-auto md:min-w-[148px]"
            >
              <Search className="h-5 w-5" />
              <span>{t("search.search")}</span>
            </button>
          </div>
        </form>

        {hasActiveFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">{t("search.activeFilters")}</span>
            {location.trim() ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--kama-accent)]">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            ) : null}
            {propertyType !== "All Properties" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--kama-accent)]">
                <Home className="h-3 w-3" /> {t(propertyTypeMessageKey(propertyType))}
              </span>
            ) : null}
            {priceTouched ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--kama-accent)]">
                ${minPrice} – ${maxPrice >= PRICE_SLIDER_MAX ? "∞" : maxPrice}{" "}
                {t("search.perNight")}
              </span>
            ) : null}
            {checkIn || checkOut ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--kama-accent)]">
                {checkIn || "…"} → {checkOut || "…"}
              </span>
            ) : null}
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs font-medium text-red-500 underline underline-offset-2 hover:text-red-700 md:ml-auto"
            >
              {t("search.clear")}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PropertySearch;
