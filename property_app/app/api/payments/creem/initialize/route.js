import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import {
  isCreemCheckoutEnabled,
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
  createCreemCheckoutSession,
  dollarsToCents,
  isCreemConfigured,
} from "@/utils/payments/creemClient";

/**
 * POST /api/payments/creem/initialize
 *
 * Starts a Creem card checkout for a stay. Charge currency is USD (listing base)
 * so fee math matches calculateBookingFees. Local arrange-with-host remains the
 * default when NEXT_PUBLIC_USE_PAYMENT_GATEWAY is off.
 */
export async function POST(req) {
  try {
    if (!isCreemCheckoutEnabled()) {
      return NextResponse.json(
        { message: "Creem checkout is not enabled" },
        { status: 403 },
      );
    }
    if (!isCreemConfigured()) {
      return NextResponse.json(
        {
          message:
            "Creem is not configured (CREEM_PRODUCTION or CREEM_API_KEY / CREEM_PRODUCT_ID)",
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
            "Online card checkout is limited to ops and partner listings right now. Request a reservation to arrange payment with the host.",
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

    const fees = calculateBookingFees(stay.base);
    const amountCents = dollarsToCents(fees.total);
    if (!amountCents) {
      return NextResponse.json(
        { message: "Invalid stay total" },
        { status: 400 },
      );
    }

    const nights = countNights(validation.checkIn, validation.checkOut);
    const requestId = `isisel_${propertyId}_${validation.checkIn}_${validation.checkOut}_${guestUserId}_${Date.now()}`;

    // Host share = accommodation + cleaning; platform keeps the service fee.
    const hostPayoutUsd =
      Math.round((fees.base + fees.cleaningFee) * 100) / 100;

    const checkout = await createCreemCheckoutSession({
      productId: process.env.CREEM_PRODUCT_ID,
      customPriceCents: amountCents,
      successUrl: appUrl(
        `/bookings/payment-success?provider=creem&property=${encodeURIComponent(String(propertyId))}`,
      ),
      requestId,
      customer: {
        email: guestEmail,
        name: guestName || undefined,
      },
      metadata: {
        platform: "isisel",
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
        currency: "USD",
        amount_total_usd: String(fees.total),
        platform_fee_usd: String(fees.commission),
        cleaning_fee_usd: String(fees.cleaningFee),
        host_payout_usd: String(hostPayoutUsd),
        request_id: requestId,
      },
    });

    const checkoutUrl = checkout.checkout_url || checkout.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { message: "Creem did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        checkout_url: checkoutUrl,
        checkout_id: checkout.id,
        request_id: requestId,
        amount_usd: fees.total,
        currency: "USD",
        host_payout_usd: hostPayoutUsd,
        platform_fee_usd: fees.commission,
      },
    });
  } catch (error) {
    console.error("Creem initialize error:", error);
    return NextResponse.json(
      {
        message:
          error?.message || "Failed to start Creem checkout",
      },
      { status: 500 },
    );
  }
}
