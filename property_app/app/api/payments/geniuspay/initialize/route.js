import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import {
  isGeniusPayCheckoutEnabled,
  isValidGuestPhone,
  normalizeGuestPhone,
} from "@/utils/bookings/paymentMode";
import { canUseOnlineCheckout } from "@/utils/payments/paymentAccess";
import {
  calculateBookingFees,
  calculateStayTotal,
  normalizeRates,
} from "@/utils/propertyRates";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";
import { appUrl } from "@/utils/appUrl";
import {
  convertUsdToGeniusPayAmount,
  createGeniusPayPayment,
  isGeniusPayConfigured,
  resolveGeniusPayFxRate,
} from "@/utils/payments/geniusPayClient";
import { resolveGeniusPayCheckoutPlan } from "@/utils/payments/geniusPayCurrency";
import {
  applyGuestPromoDiscount,
  resolveOptionalPromoAttribution,
} from "@/utils/creators/promoAttribution";

/**
 * POST /api/payments/geniuspay/initialize
 *
 * Starts GeniusPay checkout.
 * Listing fees are priced in USD; this merchant settles in whole-number XOF:
 *   - MoMo (Africa) → hosted GeniusPay (Wave / Orange / MTN) without payment_method
 *   - Card (EUR/USD or explicit card) → payment_method=card, still charged in XOF
 *
 * Creem is not used when GeniusPay is enabled (live Creem may be inactive).
 */
export async function POST(req) {
  try {
    if (!isGeniusPayCheckoutEnabled()) {
      return NextResponse.json(
        { message: "GeniusPay checkout is not enabled" },
        { status: 403 },
      );
    }
    if (!isGeniusPayConfigured()) {
      return NextResponse.json(
        {
          message:
            "GeniusPay is not configured (GENIUSPAY_API_KEY + GENIUSPAY_API_SECRET)",
        },
        { status: 503 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const guestUserId = session.user.id;
    const guestEmail = session.user.email;
    const guestName = session.user.name || "";
    if (!guestUserId || !guestEmail) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const propertyId = body.propertyId || body.property_id;
    const checkIn = body.checkIn || body.check_in;
    const checkOut = body.checkOut || body.check_out;
    const guestPhone = normalizeGuestPhone(
      body.guestPhone || body.guest_phone,
    );
    const promoCode = body.promoCode || body.promo_code || "";
    const selectedCurrency = String(
      body.currency || body.currencyCode || body.currency_code || "USD",
    )
      .trim()
      .toUpperCase();
    const checkoutRailHint = String(body.checkoutRail || body.rail || "")
      .trim()
      .toLowerCase();

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { message: "propertyId, checkIn, and checkOut are required" },
        { status: 400 },
      );
    }
    if (!isValidGuestPhone(guestPhone)) {
      return NextResponse.json(
        { message: "A valid guest phone is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const property = await Property.findById(propertyId)
      .populate("owner", "username email role")
      .lean();
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    if (!canUseOnlineCheckout(session, property)) {
      return NextResponse.json(
        {
          message:
            "Online checkout is limited to ops and partner listings right now. Request a reservation to arrange payment with the host.",
        },
        { status: 403 },
      );
    }

    if (String(property.owner?._id || property.owner) === String(guestUserId)) {
      return NextResponse.json(
        { message: "You cannot book your own listing" },
        { status: 400 },
      );
    }

    const availability = await getAvailabilityPayload(propertyId);
    const validation = validateStayDates(
      checkIn,
      checkOut,
      availability.unavailableRanges || [],
    );
    if (!validation.ok) {
      return NextResponse.json(
        { message: validation.error || "Dates are not available" },
        { status: 409 },
      );
    }

    const listingRates = normalizeRates(property.rates);
    const stay = calculateStayTotal(
      listingRates,
      availability.customDayRates || [],
      validation.checkIn,
      validation.checkOut,
    );
    if (!stay?.base) {
      return NextResponse.json(
        { message: "No rate is set for this stay length" },
        { status: 400 },
      );
    }

    const promoResult = await resolveOptionalPromoAttribution({
      propertyId,
      promoCode,
      guestId: guestUserId,
      guestEmail,
    });
    if (!promoResult.ok) {
      return NextResponse.json(
        { message: promoResult.error || "Invalid promo code" },
        { status: 400 },
      );
    }
    const attribution = promoResult.attribution;
    const discount = applyGuestPromoDiscount(
      stay.base,
      attribution?.guestDiscountRate || 0,
    );
    const fees = calculateBookingFees(discount.discountedBase);

    const plan = resolveGeniusPayCheckoutPlan(
      selectedCurrency,
      body.checkoutIntent || body.intent || checkoutRailHint || undefined,
    );
    // Always charge whole XOF on this merchant (Paystack). Card uses
    // payment_method=card; MoMo uses hosted checkout without a method.
    const fxRate = await resolveGeniusPayFxRate("XOF");
    const converted = convertUsdToGeniusPayAmount(fees.total, "XOF", fxRate);
    if (!converted) {
      return NextResponse.json(
        {
          message:
            plan.intent === "card"
              ? "Stay total is too low for card checkout"
              : "Stay total is too low for mobile money checkout",
        },
        { status: 400 },
      );
    }
    // Paystack hard-requires integer XOF.
    converted.amount = Math.round(converted.amount);

    const nights = countNights(validation.checkIn, validation.checkOut);
    const requestId = `isisel_${propertyId}_${validation.checkIn}_${validation.checkOut}_${guestUserId}_${Date.now()}`;

    const hostPayoutUsd =
      Math.round((fees.base + fees.cleaningFee) * 100) / 100;
    const hostId = String(property.owner?._id || property.owner || "");

    const successUrl = appUrl(
      `/bookings/payment-success?provider=geniuspay&property=${encodeURIComponent(String(propertyId))}`,
    );
    const errorUrl = appUrl(
      property.slug
        ? `/properties/${property.slug}`
        : `/properties/${propertyId}`,
    );

    const payment = await createGeniusPayPayment({
      amount: converted.amount,
      currency: plan.chargeCurrency,
      allowedMethods: plan.allowedMethods,
      paymentMethod: plan.paymentMethod,
      description: `Isisel stay — ${property.name || "Property"} (${validation.checkIn} → ${validation.checkOut})`,
      customer: {
        email: guestEmail,
        name: guestName || undefined,
        phone: guestPhone,
      },
      successUrl,
      errorUrl,
      metadata: {
        platform: "isisel",
        request_id: requestId,
        property_id: String(propertyId),
        property_name: property.name || "Property",
        host_id: hostId,
        host_name: property.seller_info?.name || "",
        host_email: property.seller_info?.email || "",
        check_in: validation.checkIn,
        check_out: validation.checkOut,
        nights: String(nights),
        guest_user_id: String(guestUserId),
        guest_email: guestEmail,
        guest_name: guestName || "",
        guest_phone: guestPhone,
        selected_currency: plan.selectedCurrency,
        currency: plan.chargeCurrency,
        rail: plan.rail,
        payment_method: plan.paymentMethod || "",
        amount_total_usd: String(fees.total),
        amount_charged: String(converted.amount),
        amount_xof:
          plan.chargeCurrency === "XOF" ? String(converted.amount) : "",
        usd_fx_rate: String(converted.rate),
        platform_fee_usd: String(fees.commission),
        cleaning_fee_usd: String(fees.cleaningFee),
        host_payout_usd: String(hostPayoutUsd),
        promo_code: attribution?.creatorPromoCode || "",
        guest_discount_rate: String(discount.guestDiscountRate || 0),
        guest_discount_usd: String(discount.guestDiscountAmount || 0),
        accommodation_base_usd: String(discount.discountedBase),
      },
    });

    // Direct card gateway may return payment_url (Stripe) instead of checkout_url.
    const checkoutUrl =
      payment.checkout_url || payment.payment_url || payment.redirect_url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { message: "GeniusPay did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        checkout_url: checkoutUrl,
        payment_id: payment.id,
        reference: payment.reference,
        request_id: requestId,
        amount_usd: fees.total,
        amount_charged: converted.amount,
        amount_xof:
          plan.chargeCurrency === "XOF" ? converted.amount : undefined,
        currency: plan.chargeCurrency,
        selected_currency: plan.selectedCurrency,
        rail: plan.rail,
        usd_fx_rate: converted.rate,
        host_payout_usd: hostPayoutUsd,
        platform_fee_usd: fees.commission,
      },
    });
  } catch (error) {
    console.error("GeniusPay initialize error:", error);
    return NextResponse.json(
      {
        message: error?.message || "Failed to start GeniusPay checkout",
      },
      { status: 500 },
    );
  }
}
