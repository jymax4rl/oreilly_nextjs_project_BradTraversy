"use client";

import { useEffect, useId, useRef } from "react";
import { CreditCard, Smartphone, Wallet, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

/**
 * Collects a WhatsApp-preferred guest phone before submitting a reservation.
 * When online checkout is on, paymentMethods offers:
 *   - geniuspay → MoMo (African currencies) or Apple Pay / Google Pay / card
 *     (non-African currencies) via GeniusPay
 *   - creem → Card via Creem
 */
export default function GuestPhoneModal({
  open,
  phone,
  onPhoneChange,
  onCancel,
  onConfirm,
  submitting = false,
  error = null,
  paymentMethods = null,
  /** Guest currency selector — drives GeniusPay MoMo vs card/wallet copy */
  currencyCode = "USD",
  /** When true, GeniusPay is the international card/wallet rail (not MoMo) */
  geniusPayInternational = false,
}) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef(null);

  const geniusEnabled = Boolean(paymentMethods?.geniuspay);
  const creemEnabled = Boolean(paymentMethods?.creem);
  const showMethods = geniusEnabled || creemEnabled;
  const bothMethods = geniusEnabled && creemEnabled;
  const currency = String(currencyCode || "USD").trim().toUpperCase() || "USD";
  const international = Boolean(geniusPayInternational);

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

  const defaultMethod = geniusEnabled
    ? "geniuspay"
    : creemEnabled
      ? "creem"
      : undefined;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    onConfirm?.(defaultMethod);
  };

  const geniusTitle = international
    ? "Apple Pay / Google Pay / Card"
    : "Mobile Money";
  const geniusHint = international
    ? `Pay in ${currency} — via GeniusPay`
    : "Wave, Orange Money, MTN MoMo, Moov — via GeniusPay";
  const GeniusIcon = international ? Wallet : Smartphone;

  const phonePlaceholder = international
    ? "+33 6 XX XX XX XX"
    : "+225 07 XX XX XX XX";

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
              {showMethods ? "Checkout" : "Let\u2019s stay in touch"}
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
              {showMethods
                ? international
                  ? `Share a WhatsApp number, then pay in ${currency}.`
                  : "Share a WhatsApp number, then choose how you want to pay."
                : "Share a WhatsApp number so the host can reach you about your stay."}
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
                placeholder={phonePlaceholder}
                value={phone}
                onChange={(e) => onPhoneChange?.(e.target.value)}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] placeholder:text-[var(--kama-ink-muted)] focus:ring-2 disabled:opacity-60"
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
              />
            </div>

            {error ? (
              <p
                id={`${inputId}-error`}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {bothMethods ? (
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-[var(--kama-ink-muted)]">
                  Payment method
                </legend>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => !submitting && onConfirm?.("geniuspay")}
                  className="flex w-full items-start gap-3 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3.5 py-3 text-left transition hover:border-[var(--kama-accent)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--kama-accent)]/10 text-[var(--kama-accent)]">
                    <GeniusIcon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--kama-ink)]">
                      {submitting ? "Starting…" : geniusTitle}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--kama-ink-muted)]">
                      {geniusHint}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => !submitting && onConfirm?.("creem")}
                  className="flex w-full items-start gap-3 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3.5 py-3 text-left transition hover:border-[var(--kama-accent)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--kama-accent)]/10 text-[var(--kama-accent)]">
                    <CreditCard size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--kama-ink)]">
                      {submitting ? "Starting…" : "Card"}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--kama-ink-muted)]">
                      Visa / Mastercard — via Creem
                    </span>
                  </span>
                </button>
              </fieldset>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--kama-border)] px-5 py-4">
            {bothMethods ? (
              <button
                type="button"
                onClick={() => onCancel?.()}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)] disabled:opacity-50"
              >
                Cancel
              </button>
            ) : (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showMethods ? (
                    geniusEnabled ? (
                      <GeniusIcon size={16} aria-hidden />
                    ) : (
                      <CreditCard size={16} aria-hidden />
                    )
                  ) : null}
                  {submitting
                    ? showMethods
                      ? "Starting…"
                      : "Requesting…"
                    : showMethods
                      ? geniusEnabled
                        ? international
                          ? `Pay in ${currency}`
                          : "Pay with Mobile Money"
                        : "Pay with card"
                      : "Confirm reservation"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
