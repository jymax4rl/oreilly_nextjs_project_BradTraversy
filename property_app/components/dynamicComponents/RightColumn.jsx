"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatListingPrice, resolveFxRate } from "@/utils/currencyUtils";
import { normalizeCurrencyCode } from "@/utils/mobileMoney";
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
  PLATFORM_COMMISSION_RATE,
} from "@/utils/propertyRates";
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
  isCreemCheckoutEnabled,
  isGeniusPayCheckoutEnabled,
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
  const [platformCommissionRate, setPlatformCommissionRate] = useState(
    PLATFORM_COMMISSION_RATE,
  );
  const [guestPhone, setGuestPhone] = useState("");
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneModalError, setPhoneModalError] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoHint, setPromoHint] = useState(null);
  const [promoCalculating, setPromoCalculating] = useState(false);
  /** Validated promo — drives live price update only after Calculate */
  const [appliedPromo, setAppliedPromo] = useState(null);

  const listingRates = normalizeRates(data.rates);
  const fx = resolveFxRate(rates, currencyCode);
  const paymentCurrency = normalizeCurrencyCode(fx.currencyCode);
  const isOwner = session?.user?.id === data.owner;
  const gatewayCheckout = isPaymentGatewayCheckoutEnabled();
  const creemCheckout = isCreemCheckoutEnabled();
  const geniusPayCheckout = isGeniusPayCheckoutEnabled();
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
          if (Number.isFinite(Number(payload.platformCommissionRate))) {
            setPlatformCommissionRate(Number(payload.platformCommissionRate));
          }
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

  const rawBasePriceUsd = stayPricing?.base ?? primaryRate?.amount ?? 0;
  const promoDiscountRate = appliedPromo?.guestDiscountRate || 0;
  const promoDiscountAmount =
    Math.round(rawBasePriceUsd * promoDiscountRate * 100) / 100;
  const basePriceUsd =
    Math.round((rawBasePriceUsd - promoDiscountAmount) * 100) / 100;
  const { cleaningFee, commission, total: totalUsd } =
    calculateBookingFees(basePriceUsd, {
      commissionRate: platformCommissionRate,
    });
  const commissionPctLabel =
    platformCommissionRate === 0
      ? ""
      : ` (${Math.round(platformCommissionRate * 1000) / 10}%)`;

  const numericalTotal = parseFloat((totalUsd * fx.rate).toFixed(2));

  const priceDisplay = stayPricing
    ? formatListingPrice(basePriceUsd, rates, currencyCode)
    : primaryRate
      ? formatListingPrice(
          Math.round(
            (primaryRate.amount * (1 - promoDiscountRate)) * 100,
          ) / 100,
          rates,
          currencyCode,
        )
      : "—";

  const periodLabel = stayPricing
    ? `for ${nights} night${nights !== 1 ? "s" : ""}`
    : primaryRate?.suffix || "";

  const calculatePromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoHint(null);
      setAppliedPromo(null);
      return;
    }
    setPromoCalculating(true);
    setPromoHint(null);
    try {
      const res = await fetch("/api/creators/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data._id,
          promoCode: code,
          guestEmail: session?.user?.email,
          guestId: session?.user?.id,
          accommodationBase: stayPricing?.base ?? rawBasePriceUsd,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppliedPromo(null);
        setPromoHint({ ok: false, text: "Could not check code" });
        return;
      }
      if (payload.valid) {
        const rate = Number(payload.guestDiscountRate) || 0;
        setAppliedPromo({
          code: payload.code,
          creatorName: payload.creatorName,
          guestDiscountRate: rate,
          guestDiscountPercent: payload.guestDiscountPercent,
        });
        const pct =
          payload.guestDiscountPercent ?? Math.round(rate * 1000) / 10;
        setPromoHint({
          ok: true,
          text:
            pct > 0
              ? `${pct}% off applied${
                  payload.creatorName ? ` · ${payload.creatorName}` : ""
                }`
              : payload.creatorName
                ? `Code applied for ${payload.creatorName}`
                : "Promo code applied",
        });
      } else if (!payload.empty) {
        setAppliedPromo(null);
        setPromoHint({
          ok: false,
          text: payload.error || "Invalid promo code",
        });
      } else {
        setAppliedPromo(null);
        setPromoHint(null);
      }
    } catch {
      setAppliedPromo(null);
      setPromoHint({ ok: false, text: "Could not check code" });
    } finally {
      setPromoCalculating(false);
    }
  }, [
    promoCode,
    data._id,
    session?.user?.email,
    session?.user?.id,
    stayPricing?.base,
    rawBasePriceUsd,
  ]);


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
          promoCode: promoCode.trim() || undefined,
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

  const startCreemCheckout = async (validation, phone) => {
    setPhoneModalOpen(false);
    setPendingValidation(null);
    setSubmitting(true);
    setPaymentNotice(null);
    try {
      const res = await fetch("/api/payments/creem/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data._id,
          checkIn: validation.checkIn,
          checkOut: validation.checkOut,
          guestPhone: phone,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.data?.checkout_url) {
        setPaymentNotice({
          type: "error",
          title: "Could not start card checkout",
          message:
            payload.message ||
            "Please try again, or message the host to arrange payment.",
        });
        return;
      }
      window.location.href = payload.data.checkout_url;
    } catch (err) {
      console.error("Creem checkout failed:", err);
      setPaymentNotice({
        type: "error",
        title: "Connection error",
        message: "Could not reach the payment service. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startGeniusPayCheckout = async (validation, phone) => {
    setPhoneModalOpen(false);
    setPendingValidation(null);
    setSubmitting(true);
    setPaymentNotice(null);
    try {
      const res = await fetch("/api/payments/geniuspay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data._id,
          checkIn: validation.checkIn,
          checkOut: validation.checkOut,
          guestPhone: phone,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.data?.checkout_url) {
        setPaymentNotice({
          type: "error",
          title: "Could not start mobile money checkout",
          message:
            payload.message ||
            "Please try again, or message the host to arrange payment.",
        });
        return;
      }
      window.location.href = payload.data.checkout_url;
    } catch (err) {
      console.error("GeniusPay checkout failed:", err);
      setPaymentNotice({
        type: "error",
        title: "Connection error",
        message: "Could not reach the payment service. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /** Route explicit guest choice: geniuspay = MoMo, creem = card. */
  const startGatewayCheckout = (validation, phone, method) => {
    if (method === "creem" && creemCheckout) {
      void startCreemCheckout(validation, phone);
      return;
    }
    if (method === "geniuspay" && geniusPayCheckout) {
      void startGeniusPayCheckout(validation, phone);
      return;
    }
    // Fallback when only one provider is configured.
    if (geniusPayCheckout) {
      void startGeniusPayCheckout(validation, phone);
      return;
    }
    if (creemCheckout) {
      void startCreemCheckout(validation, phone);
      return;
    }
    setPaymentNotice({
      type: "error",
      title: "Online checkout unavailable",
      message: "Please request a reservation and arrange payment with the host.",
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

  const handlePhoneConfirm = async (method) => {
    if (!pendingValidation) return;
    if (!isValidGuestPhone(guestPhone)) {
      setPhoneModalError("Enter a valid WhatsApp number so the host can reach you.");
      return;
    }

    if (!gatewayCheckout) {
      await requestManualReservation(pendingValidation, guestPhone);
      return;
    }

    startGatewayCheckout(pendingValidation, guestPhone, method);
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
            gatewayProviders={
              gatewayCheckout
                ? {
                    geniuspay: geniusPayCheckout,
                    creem: creemCheckout,
                  }
                : null
            }
          />
        </div>

        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-[var(--kama-ink-muted)]">
              {stayPricing ? "Stay total" : "From"}
              {promoDiscountAmount > 0 ? " · promo applied" : ""}
            </p>
            <p className="mt-0.5 text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight text-[var(--kama-ink)] sm:text-[1.85rem]">
              {priceDisplay}
              {periodLabel ? (
                <span className="ml-1.5 text-sm font-medium text-[var(--kama-ink-muted)]">
                  {periodLabel}
                </span>
              ) : null}
            </p>
            {promoDiscountAmount > 0 && stayPricing ? (
              <p className="mt-1 text-xs text-[var(--kama-ink-muted)] line-through tabular-nums">
                {formatListingPrice(rawBasePriceUsd, rates, currencyCode)}
              </p>
            ) : null}
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

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-[var(--kama-ink-muted)]">
                Promo code <span className="font-normal">(optional)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoHint(null);
                    setAppliedPromo(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!promoCalculating) void calculatePromo();
                    }
                  }}
                  placeholder="Creator code"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={32}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-[var(--kama-ink)] outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--kama-ink-muted)] focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => void calculatePromo()}
                  disabled={promoCalculating || !promoCode.trim()}
                  className="shrink-0 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface,white)] px-3.5 py-2.5 text-sm font-semibold text-[var(--kama-ink)] transition hover:border-[var(--kama-accent)] hover:text-[var(--kama-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {promoCalculating ? "…" : "Calculate"}
                </button>
              </div>
              {promoHint ? (
                <p
                  className={`mt-1.5 text-xs ${
                    promoHint.ok ? "text-[var(--kama-accent)]" : "text-red-700"
                  }`}
                >
                  {promoHint.text}
                </p>
              ) : null}
            </label>

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
                  ? geniusPayCheckout && creemCheckout
                    ? "Mobile Money or card at checkout"
                    : geniusPayCheckout
                      ? "Mobile Money at checkout"
                      : "Card at checkout"
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
            ? "Pay with Mobile Money or card at checkout"
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
                {formatListingPrice(rawBasePriceUsd, rates, currencyCode)}
              </span>
            </div>
            {promoDiscountAmount > 0 ? (
              <div className="flex justify-between gap-3 text-[var(--kama-accent)]">
                <span>
                  Promo
                  {appliedPromo?.code ? ` (${appliedPromo.code})` : ""}
                  {appliedPromo?.guestDiscountPercent != null
                    ? ` −${appliedPromo.guestDiscountPercent}%`
                    : ""}
                </span>
                <span className="tabular-nums">
                  −{formatListingPrice(promoDiscountAmount, rates, currencyCode)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <span>Cleaning (15%)</span>
              <span className="tabular-nums">
                {formatListingPrice(cleaningFee, rates, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Service fee{commissionPctLabel}</span>
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
        paymentMethods={
          gatewayCheckout
            ? {
                geniuspay: geniusPayCheckout,
                creem: creemCheckout,
              }
            : null
        }
      />
    </div>
  );
}

export default RightColumn;
