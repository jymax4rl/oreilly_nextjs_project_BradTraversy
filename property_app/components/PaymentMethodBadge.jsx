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

export default function PaymentMethodBadge({ currencyCode, compact = false }) {
  const code = normalizeCurrencyCode(currencyCode);
  const support = getMobileMoneySupport(code);
  const isMobile = isMobileMoneyCurrency(code);
  const label = getPaymentLabel(code, support);
  const orange = support?.useOrangeBranding;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          orange
            ? "bg-orange-100 text-orange-900"
            : isMobile
              ? "bg-emerald-100 text-emerald-900"
              : "bg-slate-100 text-slate-700"
        }`}
      >
        {isMobile ? <Smartphone size={12} /> : <CreditCard size={12} />}
        {label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        orange
          ? "border-orange-200 bg-orange-50"
          : isMobile
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-slate-50"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Payment method
      </p>
      <p
        className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold ${
          orange
            ? "text-orange-900"
            : isMobile
              ? "text-emerald-900"
              : "text-slate-800"
        }`}
      >
        {isMobile ? (
          <Smartphone size={18} className="shrink-0" aria-hidden />
        ) : (
          <CreditCard size={18} className="shrink-0" aria-hidden />
        )}
        <span>{label}</span>
        <span className="font-normal text-slate-500">({code})</span>
      </p>
      {support?.hint && isMobile ? (
        <p className="mt-1 text-xs leading-snug text-slate-600">{support.hint}</p>
      ) : !isMobile ? (
        <p className="mt-1 text-xs text-slate-600">Card or bank at checkout</p>
      ) : null}
    </div>
  );
}
