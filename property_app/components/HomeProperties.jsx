"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import propertyData from "../properties.json";
import {
  Bed,
  Bath,
  Ruler,
  MapPin,
  Search,
  Check,
  X,
  Zap,
  Shield,
  Crown,
  Heart,
} from "lucide-react";
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
  const [isLiked, setIsLiked] = useState(false);

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
    <div className="group bg-white rounded-3xl overflow-hidden flex flex-col h-full border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      <Link href={"/properties/" + property._id}>
        <div className="relative cursor-pointer h-72 overflow-hidden">
          <Image
            src={mainImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {is_featured && (
              <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                Featured
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
              {type}
            </span>
          </div>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
            <div className="text-white">
              <p className="text-2xl font-bold tracking-tight shadow-sm filter drop-shadow-sm">
                {displayRate.price}
                <span className="text-sm font-medium text-white/90 ml-1">
                  {displayRate.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Like Button (Positioned Absolute relative to card to float above image) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsLiked(!isLiked);
        }}
        className="absolute cursor-pointer top-4 right-4 z-20 p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white transition-colors duration-200 group/heart focus:outline-none"
      >
        <Heart
          size={18}
          className={`transition-colors duration-200  ${
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-white group-hover/heart:text-gray-900"
          }`}
        />
      </button>

      <Link href={"/properties/" + property._id}>
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <h3
              className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1"
              title={name}
            >
              {name}
            </h3>
            <div className="flex items-center text-gray-500 text-sm font-medium">
              <MapPin size={16} className="text-gray-400 mr-1.5" />
              <p>
                {location.city}, {location.country}
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Bed
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {beds}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Beds
                </span>
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Bath
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {baths}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Baths
                </span>
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Ruler
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {square_feet.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Sq Ft
                </span>
              </div>
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
              <Search className="w-16 h-16 text-indigo-300" />
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
