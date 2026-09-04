"use client";

import { useEffect, useId, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import GuestDateRangePicker from "@/components/calendar/GuestDateRangePicker";
import { isValidGuestPhone } from "@/utils/bookings/paymentMode";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Host-side walk-in reservation: WhatsApp required, name/email optional, dates on calendar.
 */
export default function HostCreateReservationModal({
  open,
  property,
  onClose,
  onCreated,
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [dateError, setDateError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
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
    if (!isValidGuestPhone(guestPhone)) {
      setError(t("hostConsole.createReservation.phoneRequired"));
      return;
    }
    if (!checkIn || !checkOut) {
      setError(t("hostConsole.createReservation.datesRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${property._id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim() || undefined,
          guestEmail: guestEmail.trim() || undefined,
          guestPhone,
          checkIn,
          checkOut,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("hostConsole.createReservation.failed"));
      }
      setDone(true);
      onCreated?.(data);
    } catch (err) {
      setError(err.message || t("hostConsole.createReservation.failed"));
    } finally {
      setSubmitting(false);
    }
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
        aria-label={t("hostConsole.createReservation.close")}
        disabled={submitting}
        onClick={() => !submitting && onClose?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
              <CalendarPlus size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-[var(--kama-ink)]"
              >
                {t("hostConsole.createReservation.title")}
              </h2>
              <p className="mt-0.5 truncate text-sm text-[var(--kama-ink-muted)]">
                {property.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            disabled={submitting}
            className="rounded-lg p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] disabled:opacity-50"
            aria-label={t("hostConsole.createReservation.close")}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {done ? (
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm text-[var(--kama-ink)]">
              {t("hostConsole.createReservation.success")}
            </p>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="w-full rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {t("hostConsole.createReservation.done")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <p className="text-sm leading-snug text-[var(--kama-ink-muted)]">
                {t("hostConsole.createReservation.blurb")}
              </p>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--kama-ink-muted)]">
                  <FaWhatsapp className="text-[#25D366]" aria-hidden />
                  {t("hostConsole.createReservation.whatsapp")}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="guestPhone"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  disabled={submitting}
                  placeholder="+223 7X XX XX XX"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] placeholder:text-[var(--kama-ink-muted)] focus:ring-2 disabled:opacity-60"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]">
                    {t("hostConsole.createReservation.name")}
                  </label>
                  <input
                    type="text"
                    name="guestName"
                    autoComplete="name"
                    disabled={submitting}
                    placeholder={t("hostConsole.createReservation.namePh")}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] placeholder:text-[var(--kama-ink-muted)] focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]">
                    {t("hostConsole.createReservation.email")}
                  </label>
                  <input
                    type="email"
                    name="guestEmail"
                    autoComplete="email"
                    disabled={submitting}
                    placeholder={t("hostConsole.createReservation.emailPh")}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] placeholder:text-[var(--kama-ink-muted)] focus:ring-2 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-[var(--kama-ink-muted)]">
                  {t("hostConsole.createReservation.dates")}{" "}
                  <span className="text-red-600">*</span>
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
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--kama-border)] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={submitting}
                className="rounded-xl border border-[var(--kama-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)] disabled:opacity-50"
              >
                {t("hostConsole.createReservation.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? t("hostConsole.createReservation.saving")
                  : t("hostConsole.createReservation.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
