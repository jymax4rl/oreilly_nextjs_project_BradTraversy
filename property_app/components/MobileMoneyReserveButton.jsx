"use client";

import { Smartphone } from "lucide-react";
import {
  getMobileMoneySupport,
  isMobileMoneyCurrency,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";

export default function MobileMoneyReserveButton({
  currencyCode,
  onClick,
  disabled = false,
}) {
  const code = normalizeCurrencyCode(currencyCode);
  const support = getMobileMoneySupport(code);
  const isMobileMoney = isMobileMoneyCurrency(code);

  if (!isMobileMoney || !support) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full cursor-pointer rounded-xl bg-slate-900 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reserve
      </button>
    );
  }

  const orange = support.useOrangeBranding;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold shadow-md transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
        orange
          ? "bg-orange-500 text-white hover:bg-orange-600"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      <Smartphone size={20} strokeWidth={2.25} aria-hidden />
      <span>{support.reserveLabel}</span>
    </button>
  );
}
