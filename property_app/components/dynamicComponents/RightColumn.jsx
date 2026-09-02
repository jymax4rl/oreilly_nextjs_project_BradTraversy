"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatListingPrice, resolveFxRate } from "@/utils/currencyUtils";
import {
  getFlutterwaveCountry,
  getFlutterwavePaymentOption,
  normalizeCurrencyCode,
} from "@/utils/mobileMoney";
import Currency from "@/components/Currency";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";
import MobileMoneyReserveButton from "@/components/MobileMoneyReserveButton";
import MessageOwnerButton from "@/components/MessageOwnerButton";
import PropertyMobileStickyCta from "@/components/PropertyMobileStickyCta";
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
import { useSession } from "next-auth/react";
import DeletePropertyControl from "@/components/properties/DeletePropertyControl";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import {
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
  formatClockTimeLabel,
} from "@/utils/checkInOutTimes";
import {
  isValidGuestPhone,
  isPaymentGatewayCheckoutEnabled,
} from "@/utils/bookings/paymentMode";
import GuestPhoneModal from "@/components/bookings/GuestPhoneModal";

function RightColumn({ data }) {
  const { currencyCode, rates } = useCurrency();
  const { data: session } = useSession();
  const cardRef = useRef(null);
  const [cardInView, setCardInView] = useState(true);

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [dateError, setDateError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [customDayRates, setCustomDayRates] = useState([]);
  const [guestPhone, setGuestPhone] = useState("");
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneModalError, setPhoneModalError] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const listingRates = normalizeRates(data.rates);
  const fx = resolveFxRate(rates, currencyCode);
  const paymentCurrency = normalizeCurrencyCode(fx.currencyCode);
  const isOwner = session?.user?.id === data.owner;
  const gatewayCheckout = isPaymentGatewayCheckoutEnabled();
  const checkInTimeLabel = formatClockTimeLabel(
    data.checkInTime,
    DEFAULT_CHECK_IN_TIME,
  );
  const checkOutTimeLabel = formatClockTimeLabel(
    data.checkOutTime,
    DEFAULT_CHECK_OUT_TIME,
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setCardInView(entry.isIntersecting),
      { root: null, threshold: 0.2, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
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

  const nights = checkIn && checkOut ? countNights(checkIn, checkOut) : 0;
  const stayPricing =
    checkIn && checkOut
      ? calculateStayTotal(listingRates, customDayRates, checkIn, checkOut)
      : null;
  const primaryRate = getPrimaryDisplayRate(listingRates);

  const basePriceUsd = stayPricing?.base ?? primaryRate?.amount ?? 0;
  const { cleaningFee, commission, total: totalUsd } =
    calculateBookingFees(basePriceUsd);

  const numericalTotal = parseFloat((totalUsd * fx.rate).toFixed(2));

  const priceDisplay = stayPricing
    ? formatListingPrice(stayPricing.base, rates, currencyCode)
    : primaryRate
      ? formatListingPrice(primaryRate.amount, rates, currencyCode)
      : "—";

  const periodLabel = stayPricing
    ? `for ${nights} night${nights !== 1 ? "s" : ""}`
    : primaryRate?.suffix || "";

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `ISISEL-${Date.now()}`,
    amount: numericalTotal,
    currency: paymentCurrency,
    country: getFlutterwaveCountry(paymentCurrency),
    payment_options: getFlutterwavePaymentOption(paymentCurrency),
    customer: {
      email: session?.user?.email || "",
      phone_number: guestPhone || "",
      name: session?.user?.name || "",
    },
    customizations: {
      title: "Isisel",
      description: `Reservation for ${data.name || "Property"}${
        checkIn && checkOut ? ` (${checkIn} – ${checkOut})` : ""
      }`,
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
    ...(checkIn && checkOut
      ? {
          meta: {
            property_id: String(data._id),
            property_name: data.name || "Property",
            host_id: String(data.owner || ""),
            host_name: data.seller_info?.name || "",
            host_email: data.seller_info?.email || "",
            check_in: checkIn,
            check_out: checkOut,
            nights: String(nights),
          },
        }
      : {}),
  };

  // Hook must stay unconditional; gateway path is feature-flagged at click time.
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

  const validateReserveInputs = async () => {
    if (!session) {
      window.location.assign(
        getLoginUrl(
          typeof window !== "undefined" ? window.location.pathname : "/",
        ),
      );
      return null;
    }

    if (isOwner) return null;

    if (!hasAnyRate(listingRates)) {
      setDateError("This listing has no rates configured yet.");
      return null;
    }

    if (!checkIn || !checkOut) {
      setDateError("Select check-in and check-out dates.");
      return null;
    }

    const ranges = await refreshAvailability();
    const validation = validateStayDates(checkIn, checkOut, ranges);
    if (!validation.ok) {
      setDateError(validation.error);
      return null;
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
      return null;
    }

    setDateError("");
    setPaymentNotice(null);
    return validation;
  };

  const closePhoneModal = useCallback(() => {
    if (submitting) return;
    setPhoneModalOpen(false);
    setPhoneModalError(null);
    setPendingValidation(null);
  }, [submitting]);

  const requestManualReservation = async (validation, phone) => {
    setSubmitting(true);
    setPhoneModalError(null);
    try {
      const res = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data._id,
          checkIn: validation.checkIn,
          checkOut: validation.checkOut,
          guestPhone: phone,
          currency: paymentCurrency,
          amount: numericalTotal,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhoneModalError(
          payload.error || "Please try again or message the host.",
        );
        setPaymentNotice({
          type: "error",
          title: "Could not request reservation",
          message: payload.error || "Please try again or message the host.",
        });
        return;
      }
      setPhoneModalOpen(false);
      window.location.href = "/my-bookings?reserved=1";
    } catch (err) {
      console.error("Manual booking request failed:", err);
      setPhoneModalError(
        "Could not reach the server. Check your connection and try again.",
      );
      setPaymentNotice({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startGatewayCheckout = (validation, phone) => {
    setPhoneModalOpen(false);
    setPendingValidation(null);
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
                guest_phone: phone,
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
              setPaymentNotice({
                type: "error",
                title: "Could not confirm payment",
                message:
                  payload.message ||
                  "Payment may have gone through, but we could not verify it. Save your receipt and contact support.",
              });
            } else if (payload.bookingId) {
              window.location.href = "/my-bookings?confirmed=1";
              return;
            } else if (payload.bookingError) {
              setPaymentNotice({
                type: "warning",
                title: "Payment received",
                message: `Your payment was saved, but the booking could not be completed: ${payload.bookingError}`,
              });
            }
          } catch (err) {
            console.error("Error saving transaction:", err);
            setPaymentNotice({
              type: "error",
              title: "Connection error",
              message:
                "Payment may have succeeded. Check My Bookings in a moment or contact support with your receipt.",
            });
          }
        }

        closePaymentModal();
      },
      onClose: () => {},
    });
  };

  /** Prechecks (auth, dates, availability) then open phone modal — phone is not on the sidebar. */
  const handleReserve = async () => {
    const validation = await validateReserveInputs();
    if (!validation) return;
    setPendingValidation(validation);
    setPhoneModalError(null);
    setPhoneModalOpen(true);
  };

  const handlePhoneConfirm = async () => {
    if (!pendingValidation) return;
    if (!isValidGuestPhone(guestPhone)) {
      setPhoneModalError("Enter a valid WhatsApp number so the host can reach you.");
      return;
    }

    if (!gatewayCheckout) {
      await requestManualReservation(pendingValidation, guestPhone);
      return;
    }

    startGatewayCheckout(pendingValidation, guestPhone);
  };

  return (
    <div className="relative min-w-0 overflow-visible">
      <div
        ref={cardRef}
        data-booking-card
        className="space-y-5 overflow-visible rounded-[1.35rem] border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 shadow-[0_16px_40px_rgba(12,26,26,0.06)] sm:p-6 lg:sticky lg:top-24 lg:space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Currency align="start" />
          <PaymentMethodBadge
            currencyCode={paymentCurrency}
            compact
            manual={!gatewayCheckout}
          />
        </div>

        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-[var(--kama-ink-muted)]">
              {stayPricing ? "Stay total" : "From"}
            </p>
            <p className="mt-0.5 text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight text-[var(--kama-ink)] sm:text-[1.85rem]">
              {priceDisplay}
              {periodLabel ? (
                <span className="ml-1.5 text-sm font-medium text-[var(--kama-ink-muted)]">
                  {periodLabel}
                </span>
              ) : null}
            </p>
          </div>
          <div className="mb-0.5 flex shrink-0 items-center gap-1 rounded-full bg-[var(--kama-field)] px-2.5 py-1 text-xs font-semibold text-[var(--kama-ink)]">
            <Star
              size={12}
              className="fill-[var(--kama-accent)] text-[var(--kama-accent)]"
              aria-hidden
            />
            5.0
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

            <p className="text-center text-xs text-[var(--kama-ink-muted)]">
              Check-in from {checkInTimeLabel} · Check-out by{" "}
              {checkOutTimeLabel}
            </p>

            {nights > 0 && (
              <p className="text-center text-sm font-medium text-[var(--kama-ink-muted)] animate-[calendarFadeIn_0.25s_ease-out]">
                {nights} night{nights !== 1 ? "s" : ""}
              </p>
            )}

            {dateError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {dateError}
              </p>
            )}

            {paymentNotice && (
              <div
                className={`rounded-xl border px-3 py-3 text-sm ${
                  paymentNotice.type === "error"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-950"
                }`}
                role="alert"
              >
                <p className="font-semibold">{paymentNotice.title}</p>
                <p className="mt-1 leading-snug">{paymentNotice.message}</p>
                <Link
                  href="/my-bookings"
                  className="mt-2 inline-block font-semibold underline"
                >
                  View My Bookings
                </Link>
              </div>
            )}

            <MobileMoneyReserveButton
              currencyCode={paymentCurrency}
              onClick={handleReserve}
              disabled={submitting}
              label={
                gatewayCheckout
                  ? "Reserve"
                  : submitting
                    ? "Requesting…"
                    : "Request reservation"
              }
              hint={
                gatewayCheckout
                  ? undefined
                  : "No online payment — arrange with the host after you reserve."
              }
              manual={!gatewayCheckout}
            />

            <MessageOwnerButton
              propertyId={data._id}
              listingKey={data.slug || data._id}
              ownerId={data.owner}
              ownerName={data.seller_info?.name || "host"}
              variant="compact"
              className="w-full justify-center border-[var(--kama-border)] text-[var(--kama-ink)]"
            />
          </>
        )}

        {isOwner && (
          <div className="space-y-3">
            <p className="text-center text-sm text-[var(--kama-ink-muted)]">
              This is your listing — manage{" "}
              <a
                href={`/properties/${data._id}/reservations`}
                className="font-semibold text-[var(--kama-accent)] hover:underline"
              >
                Reservations
              </a>
              ,{" "}
              <a
                href={`/properties/${data._id}/calendar`}
                className="font-semibold text-[var(--kama-accent)] hover:underline"
              >
                Calendar
              </a>{" "}
              or{" "}
              <a
                href={`/properties/${data._id}/rates`}
                className="font-semibold text-[var(--kama-accent)] hover:underline"
              >
                Rates
              </a>
              .
            </p>
            <div className="flex justify-center border-t border-[var(--kama-border)] pt-3">
              <DeletePropertyControl
                propertyId={data._id}
                propertyName={data.name}
                redirectTo="/properties/my-listings"
              />
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-[var(--kama-ink-muted)]">
          {gatewayCheckout
            ? "You won't be charged until checkout"
            : "Dates are held while you arrange payment with the host"}
        </p>

        <details className="group border-t border-[var(--kama-border)] pt-4 text-sm text-[var(--kama-ink-muted)]">
          <summary className="cursor-pointer list-none font-medium text-[var(--kama-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-[var(--kama-border-strong)] decoration-dotted underline-offset-4 group-open:mb-3 group-open:inline-block">
              Price breakdown
            </span>
          </summary>
          <div className="mt-3 space-y-2.5">
            <div className="flex justify-between gap-3">
              <span>{stayPricing ? stayPricing.label : "Base"}</span>
              <span className="tabular-nums">
                {formatListingPrice(basePriceUsd, rates, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Cleaning (15%)</span>
              <span className="tabular-nums">
                {formatListingPrice(cleaningFee, rates, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Service fee (7%)</span>
              <span className="tabular-nums">
                {formatListingPrice(commission, rates, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[var(--kama-border)] pt-2.5 font-semibold text-[var(--kama-ink)]">
              <span>Total</span>
              <span className="tabular-nums">
                {formatListingPrice(totalUsd, rates, currencyCode)}
              </span>
            </div>
          </div>
        </details>
      </div>

      {!isOwner && (
        <PropertyMobileStickyCta
          priceDisplay={priceDisplay}
          periodLabel={periodLabel}
          onReserve={handleReserve}
          currencyCode={paymentCurrency}
          visible={!cardInView}
          disabled={submitting}
          label={gatewayCheckout ? "Reserve" : "Request"}
          manual={!gatewayCheckout}
        />
      )}

      <GuestPhoneModal
        open={phoneModalOpen}
        phone={guestPhone}
        onPhoneChange={(value) => {
          setGuestPhone(value);
          if (phoneModalError) setPhoneModalError(null);
        }}
        onCancel={closePhoneModal}
        onConfirm={handlePhoneConfirm}
        submitting={submitting}
        error={phoneModalError}
      />
    </div>
  );
}

export default RightColumn;
