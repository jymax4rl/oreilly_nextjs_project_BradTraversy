"use client";
import React, { useState, useRef, useEffect } from "react";
import { Banknote, ChevronDown } from "lucide-react";
import { CURRENCIES } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";

/** @param {{ align?: "start" | "end" }} props */
const Currency = ({ align = "end" }) => {
  const { currencyCode, setCurrencyCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuAlign =
    align === "start"
      ? "left-0 right-auto origin-top-left"
      : "right-0 left-auto origin-top-right";

  const selected =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

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
    setCurrencyCode(currency.code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
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

      <div
        className={`absolute ${menuAlign} z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] transform overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl backdrop-blur-xl transition-all duration-200 sm:w-64 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="max-h-[min(18rem,50vh)] overflow-y-auto overscroll-contain p-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c)}
              className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors sm:px-4 ${
                selected.code === c.code
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <span
                  className={`shrink-0 font-bold ${
                    selected.code === c.code
                      ? "text-indigo-700"
                      : "text-gray-900"
                  }`}
                >
                  {c.code}
                </span>
                <span className="min-w-0 truncate font-medium text-gray-400">
                  {c.name.trim()}
                </span>
              </div>
              <span className="shrink-0 font-mono text-xs text-gray-500 sm:text-sm">
                {c.symbol}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Currency;
