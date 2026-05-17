"use client";

import { Smartphone } from "lucide-react";
import { getMobileMoneySupport, isMobileMoneyCurrency } from "@/utils/mobileMoney";

export default function MobileMoneyReserveButton({
  currencyCode,
  onClick,
  disabled = false,
}) {
  const support = getMobileMoneySupport(currencyCode);
  const isMobileMoney = isMobileMoneyCurrency(currencyCode);

  if (!isMobileMoney || !support) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full cursor-pointer py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 text-lg"
      >
        Reserve
      </button>
    );
  }

  const orange = support.useOrangeBranding;

  return (
    <div className="space-y-2">
      <p
        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
          orange
            ? "bg-orange-50 text-orange-800 border border-orange-200"
            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
        }`}
      >
        <Smartphone size={14} aria-hidden />
        <span>{support.hint}</span>
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full cursor-pointer py-4 font-bold rounded-xl transition-all active:scale-[0.98] text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg ${
          orange
            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
        }`}
      >
        <Smartphone size={22} strokeWidth={2.25} aria-hidden />
        <span>{support.reserveLabel}</span>
      </button>
    </div>
  );
}
