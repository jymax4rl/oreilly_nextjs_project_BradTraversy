import connectToDatabase from "@/config/database";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import User from "@/models/User";
import Property from "@/models/Property";
import { createManualBookingRequest } from "@/utils/bookings/createManualBooking";
import { isPaymentGatewayCheckoutEnabled } from "@/utils/bookings/paymentMode";
import { canUseOnlineCheckout } from "@/utils/payments/paymentAccess";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";
import {
  expoClientCorsJson,
  expoClientCorsPreflight,
} from "@/utils/mobileAuth/expoClientCors";

/**
 * POST /api/bookings/request
 * Guest creates a pending reservation without paying online.
 * Host sees guest phone and arranges payment via messaging / call / WhatsApp.
 *
 * Ops staff (when gateway is on) must use online Reserve instead of this
 * manual request path — guests always request and pay via the host.
 */
export async function OPTIONS(request) {
  return expoClientCorsPreflight(request);
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id && !session?.user?.email) {
      return expoClientCorsJson(
        request,
        { error: "Sign in to request a reservation" },
        401,
      );
    }
    if (!canBrowseListingCatalog(session)) {
      return expoClientCorsJson(
        request,
        { error: "Property not found" },
        404,
      );
    }

    const body = await request.json();
    const {
      propertyId,
      checkIn,
      checkOut,
      guestPhone,
      currency,
      amount,
      promoCode,
    } = body || {};

    if (!propertyId) {
      return expoClientCorsJson(
        request,
        { error: "propertyId is required" },
        400,
      );
    }

    const property = await Property.findById(propertyId)
      .populate("owner", "username email role")
      .lean();
    if (!property) {
      return expoClientCorsJson(
        request,
        { error: "Property not found" },
        404,
      );
    }

    if (
      isPaymentGatewayCheckoutEnabled() &&
      canUseOnlineCheckout(session, property)
    ) {
      return expoClientCorsJson(
        request,
        {
          error:
            "Online payment is required for this listing. Use Reserve to complete checkout with the payment gateway.",
        },
        403,
      );
    }

    let guestId = session.user.id ? String(session.user.id) : null;
    let guestName = session.user.name || undefined;
    let guestEmail = session.user.email || undefined;

    // Prefer DB profile when available (stable id + username).
    if (session.user.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id username email")
        .lean();
      if (user) {
        guestId = String(user._id);
        guestName = user.username || guestName;
        guestEmail = user.email || guestEmail;
      }
    }

    if (!guestId) {
      return expoClientCorsJson(
        request,
        { error: "Sign in to request a reservation" },
        401,
      );
    }

    const result = await createManualBookingRequest({
      propertyId,
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      currency,
      amountHint: amount,
      promoCode,
    });

    if (!result.ok) {
      return expoClientCorsJson(
        request,
        { error: result.error },
        result.status || 400,
      );
    }

    return expoClientCorsJson(
      request,
      {
        success: true,
        bookingId: String(result.booking._id),
        status: result.booking.status,
        paymentMode: result.booking.paymentMode,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        guestPhone: result.booking.guestPhone,
        emails: result.emails
          ? {
              guestStatus: result.emails.guestStatus,
              hostStatus: result.emails.hostStatus,
            }
          : undefined,
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/bookings/request:", error);
    return expoClientCorsJson(
      request,
      { error: "Could not create reservation" },
      500,
    );
  }
}
