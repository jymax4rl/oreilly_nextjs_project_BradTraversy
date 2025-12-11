"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaMoneyBillWave } from "react-icons/fa";
// IMPORT the shared data
import { CURRENCIES } from "../app/utils/currencyUtils";

const Currency = ({ onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with the first currency from our shared list
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (currency) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
    if (onCurrencyChange) {
      onCurrencyChange(currency.code);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex cursor-pointer justify-center items-center w-full rounded-xl border border-gray-200 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaMoneyBillWave className="mr-2 h-4 w-4 text-indigo-500" />
        <span className="font-bold mr-1">{selectedCurrency.code}</span>
        <span className="text-gray-500">({selectedCurrency.symbol})</span>
        <FaChevronDown
          className={`-mr-1 ml-2 h-4 w-4 transform transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : "rotate-0 text-gray-400"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10">
          <div className="py-1">
            {/* Map over the IMPORTED list */}
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`flex items-center w-full px-4 py-3 text-sm text-left transition duration-150 ease-in-out 
                  ${
                    currency.code === selectedCurrency.code
                      ? "bg-indigo-50 text-indigo-700 font-semibold pointer-events-none"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="font-bold w-1/4">{currency.code}</span>
                <span className="w-1/4 text-right">{currency.symbol}</span>
                <span className="text-gray-500 ml-2 truncate w-1/2">
                  {currency.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Currency;
