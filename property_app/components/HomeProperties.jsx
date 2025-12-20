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
  const [properties, setProperties] = useState(
    initialProperties.length > 0 ? initialProperties : mockProperties
  );

  const currencyMeta =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const { symbol } = currencyMeta;
  const rate = rates[currencyCode] || 1;

  // SCROLL OBSERVER LOGIC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Optional: Stop observing once visible to run animation only once
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before the bottom of the viewport
      }
    );

    const cards = document.querySelectorAll(".animate-on-scroll");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [properties]); // Re-run if properties list changes

  return (
    <section className="py-16 bg-gray-50 min-h-screen">
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

      <div className="container mx-auto px-4 ">
        <div className="w-full text-center mb-12 ">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
            <div className="md:col-span-7 text-left md:text-center">
              <PropertySearch />
            </div>
            <div className=" justify-center md:justify-end flex gap-2 items-center">
              <Currency onCurrencyChange={setCurrencyCode} />
              <DateCurrencyUpdated />
            </div>
          </div>
        </div>

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
            {properties.map((property, index) => (
              <div
                key={property._id}
                className="animate-on-scroll"
                // Optional: Keep staggered delay for items appearing together initially
                // For scrolling items, the delay is less critical but adds a nice feel
                style={{ transitionDelay: `${(index % 3) * 100}ms` }}
              >
                <PropertyCard property={property} rate={rate} symbol={symbol} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProperties;
