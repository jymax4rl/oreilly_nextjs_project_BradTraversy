"use client";

import { useEffect, useId, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import GuestDateRangePicker from "@/components/calendar/GuestDateRangePicker";
import { TRAINING_GUEST } from "@/utils/opsTraining/constants";

/**
 * Ops-only: seed a host listing with a training stay (test guest + operator WhatsApp).
 */
export default function OpsTrainingReservationModal({
  open,
  property,
  onClose,
  onCreated,
}) {
  const titleId = useId();
  const [guestName, setGuestName] = useState(TRAINING_GUEST.username);
  const [guestEmail, setGuestEmail] = useState(TRAINING_GUEST.email);
  const [guestPhone, setGuestPhone] = useState(TRAINING_GUEST.phone);
  const [status, setStatus] = useState("confirmed");
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [dateError, setDateError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setGuestName(TRAINING_GUEST.username);
      setGuestEmail(TRAINING_GUEST.email);
      setGuestPhone(TRAINING_GUEST.phone);
      setStatus("confirmed");
      setCheckIn(null);
      setCheckOut(null);
      setDateError("");
      setError("");
      setSubmitting(false);
      setDone(false);
      return;
    }
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, submitting, onClose]);

  if (!open || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut) {
      setError("Select check-in and check-out dates.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/ops/listings/${property._id}/training-reservation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: guestName.trim() || undefined,
            guestEmail: guestEmail.trim() || undefined,
            guestPhone,
            checkIn,
            checkOut,
            status,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not create training stay");
      }
      setDone(true);
      onCreated?.(data);
    } catch (err) {
      setError(err.message || "Could not create training stay");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setCheckIn(null);
    setCheckOut(null);
    setDateError("");
    setError("");
    setDone(false);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        disabled={submitting}
        onClick={() => !submitting && onClose?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B5C57]/10 text-[#1B5C57]">
              <CalendarPlus size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                Training reservation
              </h2>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {property.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            disabled={submitting}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {done ? (
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm text-gray-800">
              Training stay created. It appears on the host calendar. No emails
              were sent. Analytics ignore these bookings.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Done
              </button>
              <button
                type="button"
                onClick={resetForAnother}
                className="rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#164e4a]"
              >
                Add another stay
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={TRAINING_GUEST.image}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-[#1B5C57]/15"
                />
                <p className="text-xs leading-relaxed text-gray-600">
                  Uses the Isisel training guest. Hosts see this photo, your
                  WhatsApp, and the dates you pick. Change the name if you want
                  several different guests.
                </p>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <FaWhatsapp className="text-[#25D366]" aria-hidden />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="guestPhone"
                  required
                  disabled={submitting}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-[#1B5C57] focus:ring-2 disabled:opacity-60"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Guest name
                  </label>
                  <input
                    type="text"
                    name="guestName"
                    disabled={submitting}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-[#1B5C57] focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    name="guestEmail"
                    disabled={submitting}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-[#1B5C57] focus:ring-2 disabled:opacity-60"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-gray-500">
                  Status
                </legend>
                <div className="flex gap-2">
                  {[
                    { id: "confirmed", label: "Confirmed" },
                    { id: "pending", label: "Pending" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        status === item.id
                          ? "border-[#1B5C57] bg-[#1B5C57] text-white"
                          : "border-gray-200 bg-white text-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={item.id}
                        checked={status === item.id}
                        onChange={() => setStatus(item.id)}
                        className="sr-only"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  Dates <span className="text-red-600">*</span>
                </p>
                <GuestDateRangePicker
                  propertyId={property._id}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  embedded
                  disabled={submitting}
                  onChange={({ checkIn: nextIn, checkOut: nextOut }) => {
                    setCheckIn(nextIn);
                    setCheckOut(nextOut);
                  }}
                  onValidationError={setDateError}
                />
                {dateError ? (
                  <p className="mt-2 text-xs text-amber-800">{dateError}</p>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={submitting}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#164e4a] disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create training stay"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
