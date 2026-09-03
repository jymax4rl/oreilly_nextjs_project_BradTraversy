"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const CONFIRM_WORD = "delete";

/**
 * Destructive confirmation: user must type exactly `delete` before confirming.
 */
export default function DeletePropertyModal({
  open,
  propertyName,
  onCancel,
  onConfirm,
  isDeleting = false,
  error = null,
}) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef(null);
  const [typed, setTyped] = useState("");

  const canDelete = typed === CONFIRM_WORD && !isDeleting;

  useEffect(() => {
    if (!open) {
      setTyped("");
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape" && !isDeleting) onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isDeleting, onCancel]);

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
        disabled={isDeleting}
        onClick={() => !isDeleting && onCancel?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-[var(--kama-ink)]"
              >
                Delete this listing?
              </h2>
              <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
                This permanently removes the property from Isisel. This
                cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isDeleting && onCancel?.()}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] disabled:opacity-50"
            aria-label="Cancel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {propertyName && (
            <p className="rounded-xl bg-[var(--kama-field)] px-3 py-2.5 text-sm font-medium text-[var(--kama-ink)]">
              {propertyName}
            </p>
          )}

          <div>
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-[var(--kama-ink)]"
            >
              Type{" "}
              <code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-sm text-red-700">
                {CONFIRM_WORD}
              </code>{" "}
              to confirm
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              disabled={isDeleting}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="mt-2 w-full rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none ring-[var(--kama-accent)] transition placeholder:text-gray-400 focus:border-[var(--kama-accent)] focus:ring-2 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--kama-border)] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onCancel?.()}
            disabled={isDeleting}
            className="rounded-xl border border-[var(--kama-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={() => onConfirm?.()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:hover:bg-red-300"
          >
            {isDeleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
