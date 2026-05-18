"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Loader2, Mail, User } from "lucide-react";
import { countNights, formatGuestDate } from "@/utils/availability/validateStay";

function formatAmount(amount, currency) {
  if (amount == null || !currency) return null;
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function HostBookingRow({ booking }) {
  const nights = countNights(booking.checkIn, booking.checkOut);
  const amountLabel = formatAmount(booking.amount, booking.currency);
  const statusClass =
    booking.status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : booking.status === "pending"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-600";

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}
          >
            {booking.status}
          </span>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatGuestDate(booking.checkIn)} → {formatGuestDate(booking.checkOut)}
          </p>
          <p className="text-xs text-slate-500">
            {nights} night{nights !== 1 ? "s" : ""}
            {amountLabel ? ` · ${amountLabel}` : ""}
          </p>
        </div>
        {booking.transactionId && (
          <p className="text-[10px] font-medium text-slate-400">
            Ref #{booking.transactionId}
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <User size={14} className="shrink-0 text-slate-400" aria-hidden />
          {booking.guestName || "Guest"}
        </p>
        {booking.guestEmail && (
          <p className="flex items-center gap-2">
            <Mail size={14} className="shrink-0 text-slate-400" aria-hidden />
            <a
              href={`mailto:${booking.guestEmail}`}
              className="truncate text-indigo-600 hover:underline"
            >
              {booking.guestEmail}
            </a>
          </p>
        )}
      </div>
    </li>
  );
}

export default function HostPropertyBookings({ propertyId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/bookings?status=confirmed`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reservations");
      setBookings(data.bookings || []);
    } catch (e) {
      setError(e.message || "Could not load reservations");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = bookings.filter((b) => b.checkOut >= todayUtc());
  const past = bookings.filter((b) => b.checkOut < todayUtc());

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-indigo-600" aria-hidden />
        <h2 className="text-lg font-semibold text-slate-900">Reservations</h2>
        {!loading && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {bookings.length}
          </span>
        )}
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading reservations…
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No confirmed reservations yet. Booked nights appear on the calendar in
          gray.
        </p>
      )}

      {!loading && !error && upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Upcoming &amp; in progress
          </h3>
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <HostBookingRow key={b._id} booking={b} />
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && past.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Past
          </h3>
          <ul className="space-y-3 opacity-90">
            {past.map((b) => (
              <HostBookingRow key={b._id} booking={b} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function todayUtc() {
  const n = new Date();
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  const d = String(n.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
