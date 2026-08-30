"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import { formatGuestDate, countNights } from "@/utils/availability/validateStay";
import { propertyCardImageSrc } from "@/utils/cloudinary/propertyMediaUrls";

/**
 * Guest My Bookings card — modify/cancel when policy allows.
 * Resend confirmation lives on host manage reservations only.
 */
export default function BookingCard({ booking, onChanged }) {
  const property = booking.property;
  const name = booking.propertyName || property?.name || "Property";
  const locationLabel = property?.location
    ? [property.location.city, property.location.country]
        .filter(Boolean)
        .join(", ")
    : null;
  const nights = countNights(booking.checkIn, booking.checkOut);
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

  const canModify = booking.actions?.modify?.allowed;
  const canCancel = booking.actions?.cancel?.allowed;
  const modifyReason = booking.actions?.modify?.reason;
  const cancelReason = booking.actions?.cancel?.reason;

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

  const handleCancel = () => {
    if (
      !window.confirm(
        `Cancel your stay at ${name} (${booking.checkIn} → ${booking.checkOut})?`,
      )
    ) {
      return;
    }
    run("cancel", async () => {
      const res = await fetch(`/api/user/bookings/${booking._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by guest" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not cancel");
      setMessage({
        ok: true,
        text: data.refundEligible
          ? "Cancelled — refund will be processed if eligible"
          : "Reservation cancelled",
      });
    });
  };

  const handleSaveDates = () =>
    run("modify", async () => {
      const res = await fetch(`/api/user/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update dates");
      setEditing(false);
      setMessage({ ok: true, text: "Dates updated" });
    });

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/properties/${booking.propertyId}`}
        className="flex gap-4 p-4 sm:p-5"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-32">
          <Image
            src={propertyCardImageSrc(property?.images)}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}
            >
              {booking.status}
            </span>
            {booking.transactionId && (
              <span className="text-[10px] text-slate-400">
                Ref #{booking.transactionId}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          {locationLabel && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} className="shrink-0" aria-hidden />
              {locationLabel}
            </p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar
              size={15}
              className="shrink-0 text-[#1b5c57]"
              aria-hidden
            />
            {formatGuestDate(booking.checkIn)} –{" "}
            {formatGuestDate(booking.checkOut)}
            <span className="text-slate-400">
              ({nights} night{nights !== 1 ? "s" : ""})
            </span>
          </p>
          {booking.amount != null && booking.currency && (
            <p className="mt-2 text-sm font-semibold tabular-nums text-slate-900">
              {booking.currency} {Number(booking.amount).toLocaleString()}
            </p>
          )}
          {booking.policySummary && (
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              {booking.policySummary}
            </p>
          )}
        </div>
      </Link>

      {booking.status !== "cancelled" && (canModify || canCancel || modifyReason || cancelReason) && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {canModify && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => {
                  setEditing((v) => !v);
                  setCheckIn(booking.checkIn);
                  setCheckOut(booking.checkOut);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Pencil size={14} aria-hidden />
                Change dates
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                disabled={!!busy}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={14} aria-hidden />
                {busy === "cancel" ? "Cancelling…" : "Cancel booking"}
              </button>
            )}
          </div>
          {!canModify && modifyReason && (
            <p className="mt-2 text-[11px] text-slate-500">{modifyReason}</p>
          )}
          {!canCancel && cancelReason && (
            <p className="mt-1 text-[11px] text-slate-500">{cancelReason}</p>
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
                  Back
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
        </div>
      )}
    </article>
  );
}
