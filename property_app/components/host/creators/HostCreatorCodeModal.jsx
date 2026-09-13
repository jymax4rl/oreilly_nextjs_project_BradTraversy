"use client";

import { useEffect, useId, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { toUserFacingError } from "@/utils/userFacingError";

function rateToPercentInput(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 1000) / 10);
}

/**
 * Modal to assign a new promo code or view/edit commission % + property for an existing one.
 */
export default function HostCreatorCodeModal({
  open,
  mode = "create",
  partner,
  code = null,
  properties = [],
  onClose,
  onSaved,
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const isEdit = mode === "edit";

  const [propertyId, setPropertyId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [guestDiscountPercent, setGuestDiscountPercent] = useState("10");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setError("");
      setSubmitting(false);
      return;
    }
    if (isEdit && code) {
      setPropertyId(code.propertyId || "");
      setPromoCode(code.code || "");
      setCommissionPercent(rateToPercentInput(code.commissionRate) || "10");
      setGuestDiscountPercent(
        rateToPercentInput(
          code.guestDiscountRate != null ? code.guestDiscountRate : 0.1,
        ) || "10",
      );
    } else {
      setPropertyId("");
      setPromoCode("");
      setCommissionPercent("10");
      setGuestDiscountPercent("10");
    }
    setError("");

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
  }, [open, isEdit, code, submitting, onClose]);

  if (!open || !partner) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!propertyId) {
      setError(t("hostConsole.creators.selectProperty"));
      return;
    }
    const commission = Number(commissionPercent);
    const guestDiscount = Number(guestDiscountPercent);
    if (!Number.isFinite(commission) || commission < 1 || commission > 50) {
      setError(t("hostConsole.creators.commissionRange"));
      return;
    }
    if (
      !Number.isFinite(guestDiscount) ||
      guestDiscount < 0 ||
      guestDiscount > 50
    ) {
      setError(t("hostConsole.creators.guestDiscountRange"));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && code?.id) {
        const res = await fetch(`/api/host/creators/codes/${code.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId,
            code: promoCode,
            commissionRatePercent: commission,
            guestDiscountRatePercent: guestDiscount,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || t("hostConsole.creators.failed"));
        }
        onSaved?.(data);
      } else {
        const res = await fetch("/api/host/creators/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorPartnerId: partner.id,
            propertyId,
            code: promoCode,
            commissionRatePercent: commission,
            guestDiscountRatePercent: guestDiscount,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || t("hostConsole.creators.failed"));
        }
        onSaved?.(data);
      }
      onClose?.();
    } catch (err) {
      setError(toUserFacingError(err, t("hostConsole.creators.failed")));
    } finally {
      setSubmitting(false);
    }
  }

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
        aria-label={t("hostConsole.creators.modalClose")}
        disabled={submitting}
        onClick={() => !submitting && onClose?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
              {isEdit ? (
                <Pencil size={20} aria-hidden />
              ) : (
                <Plus size={20} aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-[var(--kama-ink)]"
              >
                {isEdit
                  ? t("hostConsole.creators.editCodeTitle")
                  : t("hostConsole.creators.assignCode")}
              </h2>
              <p className="mt-0.5 truncate text-sm text-[var(--kama-ink-muted)]">
                {partner.name}
                {isEdit && code?.code ? ` · ${code.code}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => !submitting && onClose?.()}
            className="rounded-full p-2 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            aria-label={t("hostConsole.creators.modalClose")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-4 px-5 py-4">
            <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.editCodeHint")}
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                {t("hostConsole.creators.propertyLabel")}
              </span>
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)]"
              >
                <option value="">
                  {t("hostConsole.creators.selectProperty")}
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                {t("hostConsole.creators.codeLabel")}
              </span>
              <input
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t("hostConsole.creators.codePh")}
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                  {t("hostConsole.creators.commissionLabel")}
                </span>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min={1}
                    max={50}
                    step={0.5}
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 pr-8 text-sm tabular-nums text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--kama-ink-muted)]">
                    %
                  </span>
                </div>
                <span className="mt-1 block text-[11px] text-[var(--kama-ink-muted)]">
                  {t("hostConsole.creators.commissionHelp")}
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                  {t("hostConsole.creators.guestDiscountLabel")}
                </span>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={guestDiscountPercent}
                    onChange={(e) => setGuestDiscountPercent(e.target.value)}
                    className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 pr-8 text-sm tabular-nums text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--kama-ink-muted)]">
                    %
                  </span>
                </div>
                <span className="mt-1 block text-[11px] text-[var(--kama-ink-muted)]">
                  {t("hostConsole.creators.guestDiscountHelp")}
                </span>
              </label>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--kama-border)] px-5 py-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => !submitting && onClose?.()}
              className="flex-1 rounded-full border border-[var(--kama-border)] px-4 py-2.5 text-sm font-semibold text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)] disabled:opacity-60"
            >
              {t("hostConsole.creators.modalClose")}
            </button>
            <button
              type="submit"
              disabled={submitting || properties.length === 0}
              className="flex-1 rounded-full bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:opacity-60"
            >
              {submitting
                ? t("hostConsole.creators.saving")
                : isEdit
                  ? t("hostConsole.creators.saveCode")
                  : t("hostConsole.creators.assignCode")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
