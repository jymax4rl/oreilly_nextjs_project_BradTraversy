"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, Home, SlidersHorizontal, BedDouble, Bath } from "lucide-react";
import PropertyCard from "./PropertyCard";
import Link from "next/link";
import Currency from "./Currency";
import { CURRENCIES } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import DateCurrencyUpdated from "./DateCurrencyUpdated";
import PropertySearch from "./PropertySearch";
import { Suspense } from "react";
import HostListingCardActions from "./properties/HostListingCardActions";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { propertyTypeMessageKey } from "@/lib/i18n/messages";

const HomeProperties = ({
  initialProperties = [],
  searchQuery = "",
  typeFilter = "",
  minPrice = null,
  maxPrice = null,
  minBeds = null,
  minBaths = null,
  isSavedView = false,
  hideSearchToolbar = false,
  hostListingsView = false,
}) => {
  const { t } = useLanguage();
  const { currencyCode, rates } = useCurrency();
  const [properties, setProperties] = useState(
    initialProperties.length > 0 ? initialProperties : [],
  );

  useEffect(() => {
    setProperties(initialProperties.length > 0 ? initialProperties : []);
  }, [initialProperties]);

  const currencyMeta =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const { symbol } = currencyMeta;
  const rate = rates[currencyCode] || 1;

  const hasSearch =
    searchQuery ||
    (typeFilter && typeFilter !== "All Properties") ||
    minPrice != null ||
    maxPrice != null ||
    minBeds != null ||
    minBaths != null;

  return (
    <section className="min-h-screen bg-[var(--kama-canvas-soft)] pb-16 pt-4 md:py-16 overflow-x-hidden">
      <div className="container mx-auto px-4">
        {!hideSearchToolbar && (
          <div className="mb-12 hidden w-full text-center md:block">
            <div className="grid grid-cols-8 items-center gap-4">
              <div className="col-span-7 text-left md:text-center">
                <Suspense fallback={null}>
                  <PropertySearch />
                </Suspense>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <div className="flex flex-col items-center gap-1">
                  <Currency />
                  <DateCurrencyUpdated />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile currency only when this page owns search (not immersive home) */}
        {!hideSearchToolbar && (
          <div className="mb-3 flex items-center justify-end pr-1 md:hidden">
            <div className="flex flex-col items-end gap-0.5">
              <Currency />
              <DateCurrencyUpdated />
            </div>
          </div>
        )}

        {!hideSearchToolbar && !hasSearch && !isSavedView && !hostListingsView ? (
          <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            {t("search.catalogTitle")}
          </h1>
        ) : null}

        {hasSearch ? (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery
                  ? t("search.availableIn", { place: searchQuery })
                  : t("search.catalogTitle")}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {properties.length === 1
                  ? t("search.resultsOne", { count: properties.length })
                  : t("search.resultsOther", { count: properties.length })}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-500">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--kama-accent)]">
                    <MapPin className="h-3.5 w-3.5" />
                    {searchQuery}
                  </span>
                )}
                {typeFilter && typeFilter !== "All Properties" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--kama-accent)]">
                    <Home className="h-3.5 w-3.5" />
                    {t(propertyTypeMessageKey(typeFilter))}
                  </span>
                )}
                {minBeds != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--kama-accent)]">
                    <BedDouble className="h-3.5 w-3.5" />
                    {minBeds}+ {t("search.beds")}
                  </span>
                )}
                {minBaths != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--kama-accent)]">
                    <Bath className="h-3.5 w-3.5" />
                    {minBaths}+ {t("search.baths")}
                  </span>
                )}
                {(minPrice != null || maxPrice != null) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--kama-accent)]">
                    ${minPrice ?? "0"} – ${maxPrice ?? "∞"} {t("search.perNight")}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("search.clear")}
            </Link>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white px-4 py-24 text-center shadow-sm">
            {hostListingsView ? (
              <>
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[var(--kama-accent-soft)] p-8">
                  <Home className="h-16 w-16 text-[var(--kama-accent)]" />
                </div>
                <p className="mb-4 text-3xl font-bold text-gray-900">
                  {t("empty.noListings")}
                </p>
                <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-500">
                  {t("empty.noListingsHint")}
                </p>
                <Link
                  href="/properties/add"
                  className="mt-8 cursor-pointer rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-gray-800"
                >
                  {t("empty.listProperty")}
                </Link>
              </>
            ) : (
              <>
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[var(--kama-accent-soft)] p-8">
                  <Search className="h-16 w-16 text-[var(--kama-accent)]" />
                </div>
                <p className="mb-4 text-3xl font-bold text-gray-900">
                  {t("empty.noneFound")}
                </p>
                <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-500">
                  {t("empty.noneFoundHint")}
                  {searchQuery && (
                    <>
                      {" "}
                      {t("empty.trySearch", { query: searchQuery })}
                    </>
                  )}
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/"
                    className="mt-8 cursor-pointer rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-gray-800"
                  >
                    {t("empty.goHome")}
                  </Link>
                  <Link
                    href="/properties"
                    className="mt-8 cursor-pointer rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-gray-800"
                  >
                    {t("empty.viewAll")}
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {properties.map((property) =>
              hostListingsView ? (
                <div
                  key={property._id}
                  className="overflow-hidden rounded-3xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-sm"
                >
                  <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none [&>div]:hover:shadow-none [&>div]:hover:translate-y-0">
                    <PropertyCard
                      property={property}
                      rate={rate}
                      symbol={symbol}
                      isSaved={isSavedView}
                      allowOpen
                    />
                  </div>
                  <div className="px-4 pb-4">
                    <HostListingCardActions
                      propertyId={property._id}
                      propertyName={property.name}
                      listingHref={propertyPublicPath(property)}
                      onDeleted={(id) => {
                        setProperties((prev) =>
                          prev.filter((p) => String(p._id) !== String(id)),
                        );
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div key={property._id} className="opacity-100">
                  <PropertyCard
                    property={property}
                    rate={rate}
                    symbol={symbol}
                    isSaved={isSavedView}
                  />
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProperties;
