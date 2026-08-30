"use client";

import {
  getMobileMoneySupport,
  isMobileMoneyCurrency,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";

/**
 * Primary Reserve CTA — always ocean teal.
 * Payment method (Orange Money, M-Pesa, etc.) is shown via PaymentMethodBadge,
 * not by painting this button orange.
 */
export default function MobileMoneyReserveButton({
  currencyCode,
  onClick,
  disabled = false,
  className = "",
}) {
  const code = normalizeCurrencyCode(currencyCode);
  const support = getMobileMoneySupport(code);
  const isMobileMoney = isMobileMoneyCurrency(code);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="kama-cta w-full cursor-pointer rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(27,92,87,0.2)] transition hover:bg-[var(--kama-accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reserve
      </button>
      {isMobileMoney && support?.hint ? (
        <p className="mt-2 text-center text-[11px] leading-snug text-[var(--kama-ink-muted)]">
          {support.hint}
        </p>
      ) : null}
    </div>
  );
}
