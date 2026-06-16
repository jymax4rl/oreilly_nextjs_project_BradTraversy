"use client";
import React from "react";
import { Star } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";
import {
  getFlutterwaveCountry,
  getFlutterwavePaymentOption,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";
import Currency from "@/components/Currency";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";
import MobileMoneyReserveButton from "@/components/MobileMoneyReserveButton";
import MessageOwnerButton from "@/components/MessageOwnerButton";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useSession, signIn } from "next-auth/react";

function RightColumn({ data }) {
  const { currencyCode, rates } = useCurrency();
  const { data: session } = useSession();
  const propertyRates = data.rates || {};

  const basePrice = propertyRates.weekly || propertyRates.monthly || propertyRates.nightly || 0;
  const cleaningFee = 150;
  const paymentCurrency = normalizeCurrencyCode(currencyCode);

  const numericalTotal = parseFloat(
    ((basePrice + cleaningFee) * (rates[currencyCode] || 1)).toFixed(2),
  );

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `KAMA-${Date.now()}`,
    amount: numericalTotal,
    currency: paymentCurrency,
    country: getFlutterwaveCountry(paymentCurrency),
    payment_options: getFlutterwavePaymentOption(paymentCurrency),
    customer: {
      email: session?.user?.email || "",
      phone_number: "",
      name: session?.user?.name || "",
    },
    customizations: {
      title: "Kama Properties",
      description: `Reservation for ${data.name || "Property"}`,
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleReserve = () => {
    if (!session) {
      signIn("google");
      return;
    }

    handleFlutterPayment({
      callback: async (response) => {
        if (response.status === "successful") {
          try {
            const res = await fetch("/api/transactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                property_id: data._id,
                property_name: data.name,
                host_id: data.owner,
                host_name: data.seller_info?.name || "Unknown",
                host_email: data.seller_info?.email || "",
              }),
            });
            if (!res.ok) console.error("Failed to save transaction to DB");
          } catch (err) {
            console.error("Error saving transaction:", err);
          }
        }

        closePaymentModal();
      },
      onClose: () => {},
    });
  };

  const symbol = currencyCode === "USD" ? "$" : currencyCode;

  return (
    <div className="relative min-w-0">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 sm:p-5 lg:sticky lg:top-24 lg:space-y-5 lg:p-6">
        <Currency align="start" />
        <PaymentMethodBadge currencyCode={paymentCurrency} />

        <div className="flex min-w-0 items-baseline justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
              {propertyRates.monthly
                ? formatCurrency(propertyRates.monthly, rates[currencyCode], symbol)
                : propertyRates.weekly
                  ? formatCurrency(propertyRates.weekly, rates[currencyCode], symbol)
                  : formatCurrency(propertyRates.nightly || 0, rates[currencyCode], symbol)}
            </span>
            <span className="ml-1 text-sm font-medium text-slate-500">
              {propertyRates.monthly ? "/ mo" : propertyRates.weekly ? "/ wk" : "/ night"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-bold">
            <Star size={12} className="fill-slate-900" aria-hidden /> 5.0
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300">
            <span className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
              Check-in
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
          <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300">
            <span className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
              Check-out
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
        </div>

        <MobileMoneyReserveButton
          currencyCode={paymentCurrency}
          onClick={handleReserve}
        />

        <MessageOwnerButton
          propertyId={data._id}
          ownerId={data.owner}
          ownerName={data.seller_info?.name || "host"}
          variant="compact"
          className="w-full justify-center"
        />

        <p className="text-center text-xs text-slate-400">
          You won&apos;t be charged until checkout
        </p>

        <details className="group border-t border-slate-100 pt-3 text-sm text-slate-600">
          <summary className="cursor-pointer list-none font-medium text-slate-700 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-slate-300 decoration-dotted underline-offset-4 group-open:mb-3 group-open:inline-block">
              Price breakdown
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between gap-3">
              <span>Base</span>
              <span className="tabular-nums">
                {formatCurrency(
                  propertyRates.weekly || propertyRates.monthly || propertyRates.nightly || 0,
                  rates[currencyCode],
                  symbol,
                )}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Cleaning</span>
              <span className="tabular-nums">
                {formatCurrency(150, rates[currencyCode], symbol)}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 font-bold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(basePrice + cleaningFee, rates[currencyCode], symbol)}
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default RightColumn;
