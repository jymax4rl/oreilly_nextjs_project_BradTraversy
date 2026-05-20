"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GuestDateRangePicker from "@/components/calendar/GuestDateRangePicker";
import { FREE_CANCEL_DAYS_BEFORE_CHECKIN } from "@/utils/bookings/bookingPolicy";

export default function BookingManageActions({ booking }) {
  const router = useRouter();
  const [version, setVersion] = useState(booking.version ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showModify, setShowModify] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);
  const [cancelReason, setCancelReason] = useState("");

  const canModify = booking.canModify;
  const canCancel = booking.canCancel;

  if (!canModify && !canCancel) return null;

  const handleCancel = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/user/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason,
          version,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Cancellation failed");
      }
      setShowCancel(false);
      router.refresh();
    } catch (e) {
      setError(e.message || "Cancellation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleModify = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/user/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "modify",
          checkIn,
          checkOut,
          version,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      if (data.booking?.version != null) setVersion(data.booking.version);
      setShowModify(false);
      router.refresh();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
      <div className="flex flex-wrap gap-2">
        {canModify && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowModify((v) => !v);
              setShowCancel(false);
            }}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Change dates
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowCancel((v) => !v);
              setShowModify(false);
            }}
            className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Cancel booking
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {showModify && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Pick new dates. Changes are not allowed on check-in day.
          </p>
          <GuestDateRangePicker
            propertyId={booking.propertyId}
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
            onValidationError={setError}
          />
          <button
            type="button"
            disabled={busy || !checkIn || !checkOut}
            onClick={handleModify}
            className="min-h-[44px] w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save new dates"}
          </button>
        </div>
      )}

      {showCancel && (
        <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="text-sm text-slate-700">
            {booking.refundLabel ||
              `Free cancellation is typically available ${FREE_CANCEL_DAYS_BEFORE_CHECKIN}+ days before check-in. Refunds are processed manually in this version.`}
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Reason (optional)
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
              placeholder="Tell the host why you're cancelling"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className="min-h-[44px] flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Cancelling…" : "Confirm cancellation"}
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Keep booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
