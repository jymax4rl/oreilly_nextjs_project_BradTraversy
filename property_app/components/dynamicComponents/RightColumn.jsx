"use client";
import React from "react";
import { Star } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";

/* Right Column: Sticky Booking Widget */
function RightColumn({ data }) {
  const { currencyCode, rates } = useCurrency();
  return (
    <div className="relative">
      <div className="sticky top-32 p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 bg-white space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold text-slate-900">
              {data.rates.monthly
                ? formatCurrency(
                    data.rates.monthly,
                    rates[currencyCode],
                    currencyCode === "USD" ? "$" : currencyCode
                  )
                : formatCurrency(
                    data.rates.weekly,
                    rates[currencyCode],
                    currencyCode === "USD" ? "$" : currencyCode
                  )}
            </span>
            <span className="text-slate-500 font-medium">
              {data.rates.monthly ? "/ month" : "/ week"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold bg-slate-50 px-2 py-1 rounded-md">
            <Star size={14} className="fill-slate-900" /> 5.0
          </div>
        </div>

        {/* Date Selection Inputs */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
            <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
              Check-in
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
            <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
              Check-out
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
        </div>

        <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 text-lg">
          Reserve
        </button>

        <div className="text-center text-xs text-slate-400 font-medium">
          You won't be charged yet
        </div>

        {/* Price Breakdown */}
        <div className="pt-6 border-t border-slate-100 space-y-3 text-slate-600 text-sm">
          <div className="flex justify-between">
            <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
              Base price
            </span>
            <span>
              {formatCurrency(
                data.rates.weekly || data.rates.monthly,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
              Cleaning fee
            </span>
            <span>
              {formatCurrency(
                150,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 pt-4 border-t border-slate-100 mt-4 text-base">
            <span>Total</span>
            <span>
              {/* Simple total calculation example */}
              {formatCurrency(
                (data.rates.weekly || data.rates.monthly) + 150,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightColumn;
