"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import propertyData from "../properties.json";
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";
import Button from "./Button";
import Link from "next/link";
import Currency from "./Currency";
import {
  CURRENCIES,
  fetchExchangeRates,
  formatCurrency,
} from "../app/utils/currencyUtils";
import DateCurrencyUpdated from "./DateCurrencyUpdated";

// --- Child Component ---
const PropertyCard = ({ property, rate, symbol }) => {
  const {
    name,
    type,
    location,
    beds,
    baths,
    square_feet,
    rates,
    images,
    is_featured,
  } = property;
  const mainImage = `/properties/${images[0]}`;

  // Helper to get display price using the IMPORTED function
  const getDisplayPrice = (ratesObj) => {
    if (!ratesObj) return { price: "N/A", label: "" };

    if (ratesObj.nightly) {
      return {
        // FIX: Added formatCurrency() wrapper
        price: formatCurrency(ratesObj.nightly, rate, symbol),
        label: "/ night",
      };
    }
    if (ratesObj.weekly) {
      return {
        // FIX: Added formatCurrency() wrapper (was missing entirely)
        price: formatCurrency(ratesObj.weekly, rate, symbol),
        label: "/ week",
      };
    }
    if (ratesObj.monthly) {
      return {
        // FIX: Added formatCurrency() wrapper
        price: formatCurrency(ratesObj.monthly, rate, symbol),
        label: "/ month",
      };
    }
    return { price: "Contact", label: "for rates" };
  };

  const displayRate = getDisplayPrice(rates);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full border border-gray-100">
      <Link href={"/properties/" + property._id}>
        <div className="relative cursor-pointer h-56 overflow-hidden group">
          <Image
            src={mainImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full cursor-pointer h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
          <div className="absolute top-4 left-4 flex gap-2">
            {is_featured && (
              <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Featured
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {type}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md hover:bg-black/20 hover:text-white px-4 py-2 rounded-lg shadow-lg font-bold text-gray-900 transition-colors duration-300">
            <span className="text-lg">{displayRate.price}</span>
            <span className="text-sm font-normal ml-1">
              {displayRate.label}
            </span>
          </div>
        </div>
      </Link>
      <Link href={"/properties/" + property._id}>
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center text-blue-900 text-sm mb-2 space-x-1">
            <FaMapMarkerAlt />
            <p>
              {location.city}, {location.country}
            </p>
          </div>
          <h3
            className="text-xl font-bold text-gray-900 mb-4 line-clamp-1"
            title={name}
          >
            {name}
          </h3>
          <div className="flex items-center justify-between text-gray-700 text-sm py-2 mt-auto px-2">
            <div className="flex items-center space-x-2">
              <FaBed className="text-black-400 text-s" />
              <span className="font-semibold">
                {beds}{" "}
                <span className="hidden sm:inline font-normal text-gray-500">
                  Beds
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FaBath className="text-black-400 text-s" />
              <span className="font-semibold">
                {baths}{" "}
                <span className="hidden sm:inline font-normal text-gray-500">
                  Baths
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FaRulerCombined className="text-black-400 text-s" />
              <span className="font-semibold">
                {square_feet.toLocaleString()}{" "}
                <span className="hidden sm:inline font-normal text-gray-500">
                  sqft
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// --- Main Parent Component ---
const HomeProperties = () => {
  const [currencyCode, setCurrencyCode] = useState("USD");
  const properties = propertyData;
  const [rates, setRates] = useState({}); // Store live rates here
  const [loading, setLoading] = useState(true);

  const handleCurrencyChange = (newCode) => {
    setCurrencyCode(newCode);
  };
  // Fetch rates on component mount
  useEffect(() => {
    const getRates = async () => {
      const liveRates = await fetchExchangeRates();
      if (liveRates) {
        setRates(liveRates);
      }
      setLoading(false);
    };
    getRates();
  }, []);

  // 1. Find the metadata (Symbol, Name) from our static list
  const currencyMeta =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const { symbol } = currencyMeta;

  // 2. Get the rate: Prefer live rate, fallback to static/default (which is 1)
  // If loading, we default to 1 to avoid NaN flashes
  const rate = rates[currencyCode] || 1;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 ">
        <div className="w-full text-center mb-12 ">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
            <div className="md:col-span-7 text-left md:text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Featured Properties
              </h2>
              <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
                Explore our hand-picked selection of top-tier properties
                available for short-term and long-term stays.
              </p>
            </div>
            <div className=" justify-center md:justify-end">
              <Currency onCurrencyChange={handleCurrencyChange} />
              <DateCurrencyUpdated />
            </div>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-24 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-indigo-50 p-8 rounded-full mb-6 inline-flex items-center justify-center animate-pulse-slow">
              <FaSearch className="text-6xl text-indigo-300" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              No Properties Found
            </h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
              We couldn't find any listings that match your current criteria.
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
