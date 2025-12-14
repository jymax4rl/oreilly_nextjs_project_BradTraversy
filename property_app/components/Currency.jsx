"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FaChevronDown,
  FaMoneyBillWave,
  Banknote,
  ChevronDown,
} from "lucide-react";
// IMPORT the shared data
import { CURRENCIES } from "../utils/currencyUtils";

const Currency = ({ onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(CURRENCIES[0]);

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
      setSelected(currency);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""
        }`}
      >
        <div className="p-1 bg-indigo-50 rounded-full text-indigo-600">
          <Banknote size={16} />
        </div>
        <span className="font-bold text-gray-700">{selected.code}</span>
        <span className="text-gray-400 text-sm">({selected.symbol})</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl z-50 transform transition-all duration-200 origin-top-right overflow-hidden ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="p-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleSelect(c)}
              className={`cursor-pointer w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                selected.code === c.code
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${
                    selected.code === c.code
                      ? "text-indigo-700"
                      : "text-gray-900"
                  }`}
                >
                  {c.code}
                </span>
                <span className="text-gray-400 font-medium">{c.name}</span>
              </div>
              <span className="text-gray-500 font-mono">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Currency;
