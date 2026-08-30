"use client";

import { useEffect, useState } from "react";
import {
  getMobileMoneySupport,
  isMobileMoneyCurrency,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";

/**
 * Mobile sticky booking bar — above bottom nav via --kama-chrome-clearance.
 * Shown only after the in-card Reserve scrolls out of view (Airbnb pattern).
 * Short “Reserve” label — never truncates long Orange Money copy.
 */
export default function PropertyMobileStickyCta({
  priceDisplay,
  periodLabel = "/ night",
  onReserve,
  currencyCode,
  disabled = false,
  visible = false,
}) {
  const [entered, setEntered] = useState(false);
  const code = normalizeCurrencyCode(currencyCode);
  const support = getMobileMoneySupport(code);
  const isMobileMoney = isMobileMoneyCurrency(code);
  const orange = support?.useOrangeBranding;
  const payHint = isMobileMoney
    ? support?.useOrangeBranding
      ? "Orange Money"
      : getShortPayHint(code, support)
    : null;

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    const t = setTimeout(() => setEntered(false), 280);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible && !entered) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[65] transition-all duration-300 ease-out lg:hidden ${
        visible && entered
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      }`}
      style={{ bottom: "var(--kama-chrome-clearance, 4.25rem)" }}
      data-property-sticky-cta
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto border-t border-[var(--kama-border)] bg-[color-mix(in_srgb,var(--kama-surface)_94%,transparent)] px-4 py-3 shadow-[0_-10px_32px_rgba(12,26,26,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold tabular-nums leading-tight text-[var(--kama-ink)]">
              {priceDisplay}
              <span className="ml-1 text-sm font-medium text-[var(--kama-ink-muted)]">
                {periodLabel}
              </span>
            </p>
            {payHint ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--kama-ink-muted)]">
                {orange ? (
                  <span
                    className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                    aria-hidden
                  />
                ) : null}
                <span className="truncate">{payHint}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-[var(--kama-ink-muted)]">
                No charge until checkout
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onReserve}
            disabled={disabled || !visible}
            tabIndex={visible ? 0 : -1}
            className="kama-cta inline-flex h-12 shrink-0 items-center justify-center rounded-2xl px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(27,92,87,0.2)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}

function getShortPayHint(code, support) {
  if (code === "KES") return "M-Pesa";
  if (support?.providers?.[0]) return support.providers[0];
  return "Mobile Money";
}
