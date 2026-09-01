"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * In-page reject confirm. Avoids window.prompt/alert — Chrome suppresses those
 * after "prevent additional dialogs", which made Reject look like a no-op.
 */
export default function OpsRejectHostModal({
  open,
  hostName,
  onCancel,
  onConfirm,
  isSubmitting = false,
  error = null,
}) {
  const titleId = useId();
  const reasonId = useId();
  const reasonRef = useRef(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      return;
    }
    const t = setTimeout(() => reasonRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape" && !isSubmitting) onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isSubmitting, onCancel]);

  if (!open) return null;

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
        disabled={isSubmitting}
        onClick={() => !isSubmitting && onCancel?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--kama-ink)]"
            >
              Reject this host?
            </h2>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              {hostName
                ? `${hostName} will lose host access and return to guest.`
                : "This host will lose host access and return to guest."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isSubmitting && onCancel?.()}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] disabled:opacity-50"
            aria-label="Cancel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label
              htmlFor={reasonId}
              className="block text-sm font-medium text-[var(--kama-ink)]"
            >
              Rejection reason{" "}
              <span className="font-normal text-[var(--kama-ink-muted)]">
                (optional)
              </span>
            </label>
            <textarea
              ref={reasonRef}
              id={reasonId}
              rows={4}
              value={reason}
              disabled={isSubmitting}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Shown to the applicant if they reopen onboarding…"
              className="mt-2 w-full resize-none rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20 disabled:opacity-60"
            />
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
            onClick={() => onCancel?.()}
            disabled={isSubmitting}
            className="rounded-xl border border-[var(--kama-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm?.(reason)}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Rejecting…" : "Reject host"}
          </button>
        </div>
      </div>
    </div>
  );
}
