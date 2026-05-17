"use client";
import React from "react";
import { Star } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";
import {
  getFlutterwaveCountry,
  getFlutterwavePaymentOption,
  isMobileMoneyCurrency,
} from "@/utils/mobileMoney";
import MobileMoneyReserveButton from "@/components/MobileMoneyReserveButton";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useSession, signIn } from "next-auth/react";

/* Right Column: Sticky Booking Widget */
function RightColumn({ data }) {
  const { currencyCode, rates } = useCurrency();
  const { data: session } = useSession();

  const basePrice = data.rates.weekly || data.rates.monthly;
  const cleaningFee = 150;
  const paymentCurrency = currencyCode === "USD" ? "USD" : currencyCode;
  const mobileMoneyActive = isMobileMoneyCurrency(paymentCurrency);

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

  return (
    <div className="relative">
      <div className="sticky  top-32 p-8 rounded-3xl border border-slate-200  shadow-xl/20 shadow-black-900 bg-white space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold text-slate-900">
              {data.rates.monthly
                ? formatCurrency(
                    data.rates.monthly,
                    rates[currencyCode],
                    currencyCode === "USD" ? "$" : currencyCode,
                  )
                : formatCurrency(
                    data.rates.weekly,
                    rates[currencyCode],
                    currencyCode === "USD" ? "$" : currencyCode,
                  )}
            </span>
            <span className="text-slate-500 font-medium">
              {data.rates.monthly ? "/ month" : "/ week"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold bg-slate-50 px-2 py-1 rounded-md">
            <Star size={14} className="fill-slate-900" /> 5.0
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
            <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
              Check-in
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
            <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
              Check-out
            </span>
            <span className="font-medium text-slate-900">Add date</span>
          </div>
        </div>

        <MobileMoneyReserveButton
          currencyCode={paymentCurrency}
          onClick={handleReserve}
        />

        <div className="text-center text-xs text-slate-400 font-medium">
          {mobileMoneyActive
            ? "Checkout opens with mobile money options"
            : "You won't be charged yet"}
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-3 text-slate-600 text-sm">
          <div className="flex justify-between">
            <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
              Base price
            </span>
            <span>
              {formatCurrency(
                data.rates.weekly || data.rates.monthly,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode,
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
              Cleaning fee
            </span>
            <span>
              {formatCurrency(
                150,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode,
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 pt-4 border-t border-slate-100 mt-4 text-base">
            <span>Total</span>
            <span>
              {formatCurrency(
                basePrice + cleaningFee,
                rates[currencyCode],
                currencyCode === "USD" ? "$" : currencyCode,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightColumn;
