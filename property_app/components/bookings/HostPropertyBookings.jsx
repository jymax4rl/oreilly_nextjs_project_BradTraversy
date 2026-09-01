"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { countNights, formatGuestDate } from "@/utils/availability/validateStay";
import { bookingMatchesSearch } from "@/utils/bookings/bookingRefSearch";
import {
  guestPhoneTelHref,
  guestPhoneWhatsAppHref,
} from "@/utils/bookings/paymentMode";

function formatAmount(amount, currency) {
  if (amount == null || !currency) return null;
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function HostBookingRow({ booking, propertyId, onChanged }) {
  const nights = countNights(booking.checkIn, booking.checkOut);
  const amountLabel = formatAmount(booking.amount, booking.currency);
  const statusClass =
    booking.status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : booking.status === "pending"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-600";

  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);

  const pid = propertyId || booking.propertyId;

  const run = async (label, fn) => {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      onChanged?.();
    } catch (e) {
      setMessage({ ok: false, text: e.message || "Request failed" });
    } finally {
      setBusy(null);
    }
  };

  const handleResend = () =>
    run("resend", async () => {
      const res = await fetch(`/api/bookings/${booking._id}/resend-confirmation`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not resend");
      const g = data.emails?.guestStatus;
      const h = data.emails?.hostStatus;
      setMessage({
        ok: g === "sent" || h === "sent",
        text: data.emails?.configError || `Guest: ${g || "—"}; Host: ${h || "—"}`,
      });
    });

  const handleCancel = () => {
    if (
      !window.confirm(
        `Cancel reservation for ${booking.guestName || "guest"} (${booking.checkIn} → ${booking.checkOut})?`,
      )
    ) {
      return;
    }
    run("cancel", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by host" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not cancel");
      setMessage({ ok: true, text: "Reservation cancelled" });
    });
  };

  const handleSaveDates = () =>
    run("modify", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update dates");
      setEditing(false);
      setMessage({ ok: true, text: "Dates updated" });
    });

  const canResend =
    booking.actions?.resend?.allowed !== false &&
    (booking.status === "confirmed" ||
      (booking.status === "pending" && booking.paymentMode === "manual"));
  const canModify = booking.actions?.modify?.allowed;
  const canCancel = booking.actions?.cancel?.allowed;
  const telHref = guestPhoneTelHref(booking.guestPhone);
  const waHref = guestPhoneWhatsAppHref(booking.guestPhone);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}
          >
            {booking.status === "pending" && booking.paymentMode === "manual"
              ? "Awaiting payment"
              : booking.status}
          </span>
          {booking.paymentMode === "manual" && booking.status === "pending" && (
            <p className="mt-1 text-[11px] text-amber-800">
              Arrange payment with the guest (message, call, or WhatsApp)
            </p>
          )}
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatGuestDate(booking.checkIn)} → {formatGuestDate(booking.checkOut)}
          </p>
          <p className="text-xs text-slate-500">
            {nights} night{nights !== 1 ? "s" : ""}
            {amountLabel ? ` · ${amountLabel}` : ""}
          </p>
          {booking.propertyName && (
            <p className="mt-1 text-xs font-medium text-[#1b5c57]">
              <Link
                href={`/properties/${pid}/reservations`}
                className="hover:underline"
              >
                {booking.propertyName}
              </Link>
            </p>
          )}
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
              className="truncate text-[#1b5c57] hover:underline"
            >
              {booking.guestEmail}
            </a>
          </p>
        )}
        {booking.guestPhone && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <Phone size={14} className="shrink-0 text-slate-400" aria-hidden />
              {telHref ? (
                <a
                  href={telHref}
                  className="font-medium text-[#1b5c57] hover:underline"
                >
                  {booking.guestPhone}
                </a>
              ) : (
                <span className="font-medium text-slate-700">
                  {booking.guestPhone}
                </span>
              )}
            </span>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#1b5c57] hover:underline"
              >
                WhatsApp
              </a>
            )}
          </p>
        )}
        <p className="mt-1">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b5c57] hover:underline"
          >
            <MessageCircle size={13} aria-hidden />
            Open messages
          </Link>
        </p>
      </div>

      {booking.status !== "cancelled" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {canResend && (
            <button
              type="button"
              disabled={!!busy}
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Mail size={13} aria-hidden />
              {busy === "resend" ? "Sending…" : "Resend confirmation"}
            </button>
          )}
          {canModify && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => {
                setEditing((v) => !v);
                setCheckIn(booking.checkIn);
                setCheckOut(booking.checkOut);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Pencil size={13} aria-hidden />
              Modify dates
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              disabled={!!busy}
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={13} aria-hidden />
              {busy === "cancel" ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-medium text-slate-600">
              Check-in
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1 block rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Check-out
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1 block rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={handleSaveDates}
              className="rounded-lg bg-[#1b5c57] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#164a46] disabled:opacity-60"
            >
              {busy === "modify" ? "Saving…" : "Save dates"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-2 text-xs ${
            message.ok ? "text-emerald-700" : "text-amber-800"
          }`}
        >
          {message.text}
        </p>
      )}
    </li>
  );
}

/**
 * Host-facing reservation list with resend / modify / cancel.
 * @param {{ propertyId?: string, mode?: 'property' | 'all' }} props
 */
export default function HostPropertyBookings({
  propertyId,
  mode = "property",
  title = "Reservations",
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  // Debounce search before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (mode === "all") {
        params.set("status", statusFilter);
      } else if (statusFilter !== "active") {
        params.set("status", statusFilter);
      }
      if (searchQuery) params.set("q", searchQuery);

      const qs = params.toString();
      const fetchUrl =
        mode === "all"
          ? `/api/host/reservations${qs ? `?${qs}` : ""}`
          : `/api/properties/${propertyId}/bookings${qs ? `?${qs}` : ""}`;

      const res = await fetch(fetchUrl, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reservations");
      let list = data.bookings || [];
      if (mode === "property" && statusFilter === "active") {
        list = list.filter((b) =>
          ["pending", "confirmed"].includes(b.status),
        );
      }
      if (searchQuery) {
        list = list.filter((b) => bookingMatchesSearch(b, searchQuery));
      }
      setBookings(list);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e.message || "Could not load reservations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId, mode, statusFilter, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);
  const upcoming = bookings.filter(
    (b) => b.status !== "cancelled" && b.checkOut >= todayUtc(),
  );
  const past = bookings.filter(
    (b) => b.status !== "cancelled" && b.checkOut < todayUtc(),
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  return (
    <section className={mode === "all" ? "" : "mt-8"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-[#1b5c57]" aria-hidden />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {!loading && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {bookings.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => load({ silent: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-border-strong)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)] disabled:opacity-60"
            aria-label="Refresh reservations"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : undefined}
              aria-hidden
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {updatedAt && !loading && (
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              Updated {updatedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <label className="relative block min-w-[11rem] flex-1 sm:min-w-[16rem]">
            <span className="sr-only">Search by Ref # or guest name</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Ref # or guest name"
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-700 placeholder:text-slate-400"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
            aria-label="Filter by status"
          >
            <option value="active">Active</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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
          {searchQuery
            ? `No reservations match “${searchQuery}”.`
            : "No reservations in this view yet."}
        </p>
      )}

      {!loading && !error && upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Upcoming &amp; in progress
          </h3>
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <HostBookingRow
                key={b._id}
                booking={b}
                propertyId={propertyId || b.propertyId}
                onChanged={() => load({ silent: true })}
              />
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && past.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Past
          </h3>
          <ul className="space-y-3 opacity-90">
            {past.map((b) => (
              <HostBookingRow
                key={b._id}
                booking={b}
                propertyId={propertyId || b.propertyId}
                onChanged={() => load({ silent: true })}
              />
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && cancelled.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Cancelled
          </h3>
          <ul className="space-y-3 opacity-75">
            {cancelled.map((b) => (
              <HostBookingRow
                key={b._id}
                booking={b}
                propertyId={propertyId || b.propertyId}
                onChanged={() => load({ silent: true })}
              />
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
