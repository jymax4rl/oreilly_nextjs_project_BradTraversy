"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

/**
 * Collects a WhatsApp-preferred guest phone before submitting a reservation request.
 * Matches other Kama dialogs: Escape, overlay click, body scroll lock, teal CTAs.
 */
export default function GuestPhoneModal({
  open,
  phone,
  onPhoneChange,
  onCancel,
  onConfirm,
  submitting = false,
  error = null,
}) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submitting) onConfirm?.();
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
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => !submitting && onCancel?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366]"
              aria-hidden
            >
              <FaWhatsapp size={22} />
            </span>
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--kama-ink)]"
            >
              Let&apos;s stay in touch
            </h2>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onCancel?.()}
            disabled={submitting}
            className="rounded-lg p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] disabled:opacity-50"
            aria-label="Cancel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <p className="text-sm leading-snug text-[var(--kama-ink-muted)]">
              Share a WhatsApp number so the host can reach you about your stay.
            </p>

            <div>
              <label
                htmlFor={inputId}
                className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]"
              >
                WhatsApp number <span className="text-red-600">*</span>
              </label>
              <input
                ref={inputRef}
                id={inputId}
                type="tel"
                name="guestPhone"
                autoComplete="tel"
                inputMode="tel"
                required
                disabled={submitting}
                placeholder="+237 6XX XXX XXX"
                value={phone}
                onChange={(e) => onPhoneChange?.(e.target.value)}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] placeholder:text-[var(--kama-ink-muted)] focus:ring-2 disabled:opacity-60"
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
              />
            </div>

            {error && (
              <p
                id={`${inputId}-error`}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--kama-border)] px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onCancel?.()}
              disabled={submitting}
              className="rounded-xl border border-[var(--kama-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Requesting…" : "Confirm reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
