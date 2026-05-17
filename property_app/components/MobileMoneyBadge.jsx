"use client";

import { Smartphone } from "lucide-react";
import { getMobileMoneySupport, isMobileMoneyCurrency } from "@/utils/mobileMoney";

/** Compact indicator for listing cards when the selected currency supports mobile money. */
export default function MobileMoneyBadge({ currencyCode, className = "" }) {
  const support = getMobileMoneySupport(currencyCode);
  if (!isMobileMoneyCurrency(currencyCode) || !support) return null;

  const orange = support.useOrangeBranding;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${className} ${
        orange
          ? "bg-orange-500/90 text-white"
          : "bg-emerald-600/90 text-white"
      }`}
    >
      <Smartphone size={10} aria-hidden />
      {orange ? "Orange Money" : "Mobile Money"}
    </span>
  );
}
