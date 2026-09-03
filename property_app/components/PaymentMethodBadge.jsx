"use client";

import { CreditCard, Smartphone } from "lucide-react";
import {
  getMobileMoneySupport,
  isMobileMoneyCurrency,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";

function getPaymentLabel(code, support) {
  if (support?.useOrangeBranding) return "Orange Money";
  if (code === "KES") return "M-Pesa";
  if (isMobileMoneyCurrency(code)) return "Mobile Money";
  return "Card or bank";
}

/**
 * Restrained payment hint — chip by default (not a peach callout panel).
 * Orange Money keeps a small brand cue; chrome stays ocean teal.
 */
export default function PaymentMethodBadge({
  currencyCode,
  compact = true,
  manual = false,
}) {
  const code = normalizeCurrencyCode(currencyCode);
  const support = getMobileMoneySupport(code);
  const isMobile = isMobileMoneyCurrency(code);
  const label = manual ? "Pay host directly" : getPaymentLabel(code, support);
  const orange = !manual && support?.useOrangeBranding;

  if (compact) {
    return (
      <span
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--kama-border)] bg-[var(--kama-field)] px-2.5 py-1 text-[12px] font-medium text-[var(--kama-ink-muted)]"
        role="status"
        aria-live="polite"
      >
        {manual || isMobile ? (
          <Smartphone
            size={12}
            className={
              orange ? "shrink-0 text-orange-600" : "shrink-0 text-[var(--kama-accent)]"
            }
            aria-hidden
          />
        ) : (
          <CreditCard
            size={12}
            className="shrink-0 text-[var(--kama-accent)]"
            aria-hidden
          />
        )}
        <span className="truncate text-[var(--kama-ink)]">{label}</span>
        {!manual ? (
          <span className="shrink-0 opacity-60">{code}</span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3.5 py-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] font-medium tracking-wide text-[var(--kama-ink-muted)]">
        Payment
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-[var(--kama-ink)]">
        {manual || isMobile ? (
          <Smartphone
            size={16}
            className={
              orange ? "shrink-0 text-orange-600" : "shrink-0 text-[var(--kama-accent)]"
            }
            aria-hidden
          />
        ) : (
          <CreditCard
            size={16}
            className="shrink-0 text-[var(--kama-accent)]"
            aria-hidden
          />
        )}
        <span>{label}</span>
        {!manual ? (
          <span className="font-normal text-[var(--kama-ink-muted)]">({code})</span>
        ) : null}
      </p>
      {manual ? (
        <p className="mt-1 text-xs leading-snug text-[var(--kama-ink-muted)]">
          Arrange payment with the host after you reserve
        </p>
      ) : support?.hint && isMobile ? (
        <p className="mt-1 text-xs leading-snug text-[var(--kama-ink-muted)]">
          {support.hint}
        </p>
      ) : !isMobile ? (
        <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
          Card or bank at checkout
        </p>
      ) : null}
    </div>
  );
}
