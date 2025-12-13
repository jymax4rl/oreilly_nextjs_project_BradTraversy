"use client";
import React, { useRef, useState, useEffect } from "react";
import { MapPin, Home, Search, ChevronDown } from "lucide-react";
// --- OPTIONS DATA ---
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
// --- SEARCH COMPONENT ---
const PropertySearch = () => {
  const [propertyType, setPropertyType] = useState("All Properties");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[12vh] mb-12">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-10 transform transition-all hover:shadow-3xl">
        <form className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
          {/* Location Input */}
          <div className="w-full md:flex-[2] relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <label htmlFor="location" className="sr-only">
              Location
            </label>
            <input
              type="text"
              id="location"
              placeholder="Enter Location (City, Zip, etc)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Property Type Select */}
          <div className="w-full md:flex-[1.5] relative group ">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Home className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <label htmlFor="property-type" className="sr-only">
              Property Type
            </label>
            <div className="relative">
              <div className="w-full md:flex-[1.5] relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Home className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <label htmlFor="property-type" className="sr-only">
                  Property Type
                </label>
                <div className="relative">
                  {/* Custom Property Type Select */}
                  <div
                    className="w-full md:flex-[1.5] relative group"
                    ref={dropdownRef}
                  >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Home className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <label htmlFor="property-type" className="sr-only">
                      Property Type
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="cursor-pointer w-full pl-12 pr-4 py-4 text-left rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm flex items-center justify-between"
                    >
                      <span className="block truncate">{propertyType}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Floating Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                        <div className="max-h-60 overflow-auto py-2 custom-scrollbar">
                          {PROPERTY_TYPES.map((type) => (
                            <div
                              key={type}
                              onClick={() => {
                                setPropertyType(type);
                                setIsDropdownOpen(false);
                              }}
                              className={`px-4 py-3 cursor-pointer transition-colors text-sm flex items-center justify-between ${
                                propertyType === type
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
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
                </div>
              </div>
            </div>
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
      </div>
    </section>
  );
};

export default PropertySearch;
