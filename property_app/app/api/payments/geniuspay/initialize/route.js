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
  createGeniusPayPayment,
  getUsdToXofRate,
  isGeniusPayConfigured,
  usdToXof,
} from "@/utils/payments/geniusPayClient";

/**
 * POST /api/payments/geniuspay/initialize
 *
 * Starts GeniusPay hosted checkout (Wave / Orange / MTN / Moov / card).
 * Listing fees stay in USD; we charge XOF via GENIUSPAY_USD_TO_XOF (default 600).
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
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    if (String(property.owner) === String(guestUserId)) {
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

    const fees = calculateBookingFees(stay.base);
    const fxRate = getUsdToXofRate();
    const amountXof = usdToXof(fees.total, fxRate);
    if (!amountXof) {
      return NextResponse.json(
        { message: "Stay total is too low for mobile money checkout" },
        { status: 400 },
      );
    }

    const nights = countNights(validation.checkIn, validation.checkOut);
    const requestId = `isisel_${propertyId}_${validation.checkIn}_${validation.checkOut}_${guestUserId}_${Date.now()}`;

    const hostPayoutUsd =
      Math.round((fees.base + fees.cleaningFee) * 100) / 100;

    const successUrl = appUrl(
      `/bookings/payment-success?provider=geniuspay&property=${encodeURIComponent(String(propertyId))}`,
    );
    const errorUrl = appUrl(
      property.slug
        ? `/properties/${property.slug}`
        : `/properties/${propertyId}`,
    );

    const payment = await createGeniusPayPayment({
      amountXof,
      currency: "XOF",
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
        host_id: String(property.owner || ""),
        host_name: property.seller_info?.name || "",
        host_email: property.seller_info?.email || "",
        check_in: validation.checkIn,
        check_out: validation.checkOut,
        nights: String(nights),
        guest_user_id: String(guestUserId),
        guest_email: guestEmail,
        guest_name: guestName || "",
        guest_phone: guestPhone,
        currency: "XOF",
        amount_total_usd: String(fees.total),
        amount_xof: String(amountXof),
        usd_to_xof: String(fxRate),
        platform_fee_usd: String(fees.commission),
        cleaning_fee_usd: String(fees.cleaningFee),
        host_payout_usd: String(hostPayoutUsd),
      },
    });

    const checkoutUrl = payment.checkout_url || payment.payment_url;
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
        amount_xof: amountXof,
        currency: "XOF",
        usd_to_xof: fxRate,
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
