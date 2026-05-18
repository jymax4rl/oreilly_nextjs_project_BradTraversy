"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

export default function AmenitiesAccordion({ amenities = [] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const count = amenities.length;

  if (count === 0) return null;

  return (
    <section className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50/80 sm:px-5 sm:py-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Sparkles size={18} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="block text-base font-semibold text-slate-900 sm:text-lg">
              What this place offers
            </span>
            <span className="text-sm text-slate-500">
              {count} amenit{count === 1 ? "y" : "ies"}
            </span>
          </div>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-slate-500 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
          open
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2.5">
            {amenities.map((amenity, idx) => (
              <li
                key={`${amenity}-${idx}`}
                className="flex min-w-0 items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-slate-700"
              >
                <Check
                  size={16}
                  className="shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="min-w-0 text-sm font-medium break-words">
                  {amenity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
