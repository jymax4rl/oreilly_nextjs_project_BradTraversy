"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Home, Search, ChevronDown, X } from "lucide-react";

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

const PropertySearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params (back-button persistence)
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("type") || "All Properties",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click (preserved)
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
    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);

    // Add router.refresh() after router.push() to guarantee the server component re-fetches from MongoDB
    router.refresh();
  };

  const clearSearch = () => {
    setLocation("");
    setPropertyType("All Properties");
    setMinPrice("");
    setMaxPrice("");
    inputRef.current?.focus();
  };

  const hasActiveFilters =
    location.trim() ||
    propertyType !== "All Properties" ||
    minPrice.trim() ||
    maxPrice.trim();

  return (
    <section className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[12vh] mb-12">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4 items-center justify-center w-full"
        >
          {/* Location Input */}
          <div className="w-full md:flex-[2] relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter Location (City, Country, Street...)"
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
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
              className="cursor-pointer w-full pl-12 pr-4 py-4 text-left rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm flex items-center justify-between"
            >
              <span className="block truncate">{propertyType}</span>
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
                      className={`px-4 py-3 cursor-pointer transition-colors text-sm flex items-center justify-between ${propertyType === type ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {type}
                      {propertyType === type && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price range */}
          <div className="w-full md:flex-[1.2] grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min $/night"
              className="w-full py-4 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max $/night"
              className="w-full py-4 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="cursor-pointer w-full md:w-auto md:min-w-[160px] py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </form>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            {location.trim() && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            {propertyType !== "All Properties" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                <Home className="h-3 w-3" /> {propertyType}
              </span>
            )}
            {(minPrice.trim() || maxPrice.trim()) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                ${minPrice || "0"} – ${maxPrice || "∞"} / night
              </span>
            )}
            <button
              onClick={clearSearch}
              className="text-red-500 hover:text-red-700 underline underline-offset-2 text-xs font-medium ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertySearch;
