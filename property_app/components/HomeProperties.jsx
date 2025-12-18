"use client";
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import PropertyCard from "./PropertyCard";
import Link from "next/link";
import Currency from "./Currency";
import { formatCurrency, CURRENCIES } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import DateCurrencyUpdated from "./DateCurrencyUpdated";
import PropertySearch from "./PropertySearch";

// --- Main Parent Component ---
const HomeProperties = ({ initialProperties = [] }) => {
  const { currencyCode, setCurrencyCode, rates, loading } = useCurrency();
  const [properties, setProperties] = useState(initialProperties);

  // 1. Find the metadata (Symbol, Name) from our static list
  const currencyMeta =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const { symbol } = currencyMeta;

  // 2. Get the rate: Prefer live rate, fallback to static/default (which is 1)
  const rate = rates[currencyCode] || 1;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 ">
        <div className="w-full text-center mb-12 ">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
            <div className="md:col-span-7 text-left md:text-center">
              <PropertySearch />
            </div>
            <div className=" justify-center md:justify-end">
              <Currency onCurrencyChange={setCurrencyCode} />
              <DateCurrencyUpdated />
            </div>
          </div>
        </div>

        {/* // If loading, we default to 1 to avoid NaN flashes */}

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
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                rate={rate}
                symbol={symbol}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProperties;
