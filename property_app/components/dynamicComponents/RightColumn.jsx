"use client";
import React, { useCallback, useState } from "react";
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
import GuestDateRangePicker from "@/components/calendar/GuestDateRangePicker";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";
import {
  calculateBookingFees,
  calculateStayTotal,
  getPrimaryDisplayRate,
  hasAnyRate,
  normalizeRates,
} from "@/utils/propertyRates";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useSession, signIn } from "next-auth/react";

function RightColumn({ data }) {
  const { currencyCode, rates } = useCurrency();
  const { data: session } = useSession();
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [dateError, setDateError] = useState("");
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [customDayRates, setCustomDayRates] = useState([]);

  const listingRates = normalizeRates(data.rates);
  const paymentCurrency = normalizeCurrencyCode(currencyCode);
  const isOwner = session?.user?.id === data.owner;

  const nights = checkIn && checkOut ? countNights(checkIn, checkOut) : 0;
  const stayPricing =
    checkIn && checkOut
      ? calculateStayTotal(listingRates, customDayRates, checkIn, checkOut)
      : null;
  const primaryRate = getPrimaryDisplayRate(listingRates);

  const basePriceUsd = stayPricing?.base ?? primaryRate?.amount ?? 0;
  const { cleaningFee, commission, total: totalUsd } =
    calculateBookingFees(basePriceUsd);

  const numericalTotal = parseFloat(
    (totalUsd * (rates[currencyCode] || 1)).toFixed(2),
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
      description: `Reservation for ${data.name || "Property"}${
        checkIn && checkOut ? ` (${checkIn} – ${checkOut})` : ""
      }`,
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const refreshAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${data._id}/availability`);
      const payload = await res.json();
      if (res.ok) {
        const ranges = payload.unavailableRanges || [];
        setUnavailableRanges(ranges);
        setCustomDayRates(payload.customDayRates || []);
        return ranges;
      }
    } catch {
      /* ignore */
    }
    return unavailableRanges;
  }, [data._id, unavailableRanges]);

  const handleDatesChange = ({ checkIn: inDate, checkOut: outDate }) => {
    setCheckIn(inDate);
    setCheckOut(outDate);
    setDateError("");
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/properties/${data._id}/availability`);
        const payload = await res.json();
        if (!cancelled && res.ok) {
          setUnavailableRanges(payload.unavailableRanges || []);
          setCustomDayRates(payload.customDayRates || []);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data._id]);

  const handleReserve = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!hasAnyRate(listingRates)) {
      setDateError("This listing has no rates configured yet.");
      return;
    }

    if (!checkIn || !checkOut) {
      setDateError("Select check-in and check-out dates.");
      return;
    }

    const ranges = await refreshAvailability();
    const validation = validateStayDates(checkIn, checkOut, ranges);
    if (!validation.ok) {
      setDateError(validation.error);
      return;
    }

    const pricing = calculateStayTotal(
      listingRates,
      customDayRates,
      validation.checkIn,
      validation.checkOut,
    );
    if (!pricing) {
      setDateError(
        "No rate is set for this stay length. Try different dates or contact the host.",
      );
      return;
    }

    setDateError("");

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
                check_in: validation.checkIn,
                check_out: validation.checkOut,
                nights: countNights(validation.checkIn, validation.checkOut),
                amount: numericalTotal,
                currency: paymentCurrency,
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
              console.error("Failed to save transaction to DB", payload);
            } else if (payload.bookingId) {
              window.location.href = "/my-bookings?confirmed=1";
              return;
            } else if (payload.bookingError) {
              console.error("Booking error:", payload.bookingError);
            }
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
            {stayPricing ? (
              <>
                <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
                  {formatCurrency(
                    stayPricing.base,
                    rates[currencyCode],
                    symbol,
                  )}
                </span>
                <span className="ml-1 text-sm font-medium text-slate-500">
                  for {nights} night{nights !== 1 ? "s" : ""}
                </span>
              </>
            ) : primaryRate ? (
              <>
                <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
                  {formatCurrency(
                    primaryRate.amount,
                    rates[currencyCode],
                    symbol,
                  )}
                </span>
                <span className="ml-1 text-sm font-medium text-slate-500">
                  {primaryRate.suffix}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-slate-600">
                Contact for rates
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-bold">
            <Star size={12} className="fill-slate-900" aria-hidden /> 5.0
          </div>
        </div>

        {!isOwner && (
          <>
            <GuestDateRangePicker
              propertyId={data._id}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={handleDatesChange}
              onValidationError={setDateError}
            />

            {nights > 0 && (
              <p className="text-center text-sm font-medium text-slate-600 animate-[calendarFadeIn_0.25s_ease-out]">
                {nights} night{nights !== 1 ? "s" : ""}
              </p>
            )}

            {dateError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {dateError}
              </p>
            )}

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
          </>
        )}

        {isOwner && (
          <p className="text-center text-sm text-slate-500">
            This is your listing — manage{" "}
            <a
              href={`/properties/${data._id}/calendar`}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Calendar
            </a>{" "}
            or{" "}
            <a
              href={`/properties/${data._id}/rates`}
              className="font-semibold text-emerald-600 hover:underline"
            >
              Rates
            </a>
            .
          </p>
        )}

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
              <span>{stayPricing ? stayPricing.label : "Base"}</span>
              <span className="tabular-nums">
                {formatCurrency(basePriceUsd, rates[currencyCode], symbol)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Cleaning (15%)</span>
              <span className="tabular-nums">
                {formatCurrency(cleaningFee, rates[currencyCode], symbol)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Service fee (7%)</span>
              <span className="tabular-nums">
                {formatCurrency(commission, rates[currencyCode], symbol)}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 font-bold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(totalUsd, rates[currencyCode], symbol)}
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default RightColumn;
