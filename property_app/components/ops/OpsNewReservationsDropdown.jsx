"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

function formatStay(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "—";
  return `${checkIn} → ${checkOut}`;
}

/**
 * Listings-page dropdown of newest pending reservations, with search.
 */
export default function OpsNewReservationsDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [counts, setCounts] = useState({ new: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 280);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "new" });
      if (searchQuery) params.set("q", searchQuery);
      const res = await fetch(`/api/ops/reservations?${params}&nc=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
      if (data.counts) setCounts({ new: Number(data.counts.new) || 0 });
    } catch (err) {
      console.error("Ops reservations dropdown:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          open
            ? "bg-[#1B5C57] text-white"
            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        New reservations
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
            open ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}
        >
          {counts.new}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,26rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-3">
            <label className="sr-only" htmlFor="ops-new-reservations-search">
              Search new reservations
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                id="ops-new-reservations-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Guest, listing, host, ref…"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
            ) : reservations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                {searchQuery
                  ? "No new reservations match that search."
                  : "No new reservations yet."}
              </p>
            ) : (
              <ul>
                {reservations.slice(0, 12).map((row) => (
                  <li key={row._id} className="border-b border-gray-50 last:border-0">
                    <Link
                      href={`/ops/reservations?propertyId=${encodeURIComponent(row.propertyId)}`}
                      className="block px-4 py-3 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                    >
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {row.guestName || row.guestEmail || "Guest"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {row.propertyName}
                        {row.propertyLocation ? ` · ${row.propertyLocation}` : ""}
                      </p>
                      <p className="mt-0.5 text-[11px] text-amber-700">
                        {formatStay(row.checkIn, row.checkOut)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
            <Link
              href="/ops/reservations"
              className="block rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-[#1B5C57] hover:bg-white"
              onClick={() => setOpen(false)}
            >
              View all reservations
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
