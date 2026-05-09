"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, Home, SlidersHorizontal } from "lucide-react";
import PropertyCard from "./PropertyCard";
import Link from "next/link";
import Currency from "./Currency";
import { formatCurrency, CURRENCIES } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import DateCurrencyUpdated from "./DateCurrencyUpdated";
import PropertySearch from "./PropertySearch";
import { Suspense } from "react";

const HomeProperties = ({
  initialProperties = [],
  searchQuery = "",
  typeFilter = "",
  isSavedView = false,
}) => {
  const { currencyCode, setCurrencyCode, rates, loading } = useCurrency();
  const [properties, setProperties] = useState(
    initialProperties.length > 0 ? initialProperties : [],
  );

  // Add a useEffect that updates the properties state whenever initialProperties changes (backup defense):
  useEffect(() => {
    setProperties(initialProperties.length > 0 ? initialProperties : []);
  }, [initialProperties]);

  useEffect(() => {
    setProperties(initialProperties.length > 0 ? initialProperties : []);
  }, [initialProperties]);

  const currencyMeta =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const { symbol } = currencyMeta;
  const rate = rates[currencyCode] || 1;

  // SCROLL OBSERVER LOGIC (preserved exactly)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    const cards = document.querySelectorAll(".animate-on-scroll");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [properties]);

  const hasSearch =
    searchQuery || (typeFilter && typeFilter !== "All Properties");

  return (
    <section className="pt-4 pb-16 md:py-16 bg-gray-50 min-h-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `,
        }}
      />

      <div className="container mx-auto px-4">
        {/* Toolbar: hidden on mobile (search is in MobileTopChrome, currency shown below) */}
        <div className="hidden md:block w-full text-center mb-12">
          <div className="grid grid-cols-8 gap-4 items-center">
            <div className="col-span-7 text-left md:text-center">
              <Suspense fallback={null}>
                <PropertySearch />
              </Suspense>
            </div>
            <div className="flex justify-end items-center col-span-1">
              <div className="flex flex-col items-center gap-1">
                <Currency onCurrencyChange={setCurrencyCode} />
                <DateCurrencyUpdated />
              </div>
            </div>
          </div>
        </div>
        {/* Mobile-only: currency selector above cards */}
        <div className="flex md:hidden justify-end items-center mb-3 pr-1">
          <div className="flex flex-col items-end gap-0.5">
            <Currency onCurrencyChange={setCurrencyCode} />
            <DateCurrencyUpdated />
          </div>
        </div>

        {/* Search Results Context Header */}
        {hasSearch && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {properties.length} result{properties.length !== 1 ? "s" : ""}{" "}
                found
              </h2>
              <p className="text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    {searchQuery}
                  </span>
                )}
                {typeFilter && typeFilter !== "All Properties" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    <Home className="h-3.5 w-3.5" />
                    {typeFilter}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Clear filters
            </Link>
          </div>
        )}

        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-24 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-6">
              Loading Kama Properties
            </h3>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Fetching the Kama Properties...
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-24 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-indigo-50 p-8 rounded-full mb-6 inline-flex items-center justify-center animate-pulse-slow">
              <Search className="w-16 h-16 text-indigo-300" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              No Properties Found
            </h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any listings that match your current
              criteria.
              {searchQuery && (
                <>
                  {" "}
                  Try adjusting your search for{" "}
                  <strong>&quot;{searchQuery}&quot;</strong>.
                </>
              )}
            </p>
            <div className="flex gap-4">
              <Link
                href="/"
                className="mt-8 px-8 py-3 cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors duration-300 shadow-md"
              >
                Go Home
              </Link>
              <Link
                href="/properties"
                className="mt-8 px-8 py-3 cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors duration-300 shadow-md"
              >
                View All Properties
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <div
                key={property._id}
                className="animate-on-scroll"
                style={{ transitionDelay: `${(index % 3) * 100}ms` }}
              >
                <PropertyCard
                  property={property}
                  rate={rate}
                  symbol={symbol}
                  isSaved={isSavedView}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProperties;
