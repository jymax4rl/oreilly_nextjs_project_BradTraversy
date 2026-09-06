import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import User from "@/models/User";
import Property from "@/models/Property";
import { createManualBookingRequest } from "@/utils/bookings/createManualBooking";
import { isPaymentGatewayCheckoutEnabled } from "@/utils/bookings/paymentMode";
import { canUseOnlineCheckout } from "@/utils/payments/paymentAccess";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";

/**
 * POST /api/bookings/request
 * Guest creates a pending reservation without paying online.
 * Host sees guest phone and arranges payment via messaging / call / WhatsApp.
 *
 * When the gateway soft-launch applies to this guest/listing (ops or partner
 * Sadio Diallo), force them through online Reserve instead.
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return Response.json(
        { error: "Sign in to request a reservation" },
        { status: 401 },
      );
    }
    if (!canBrowseListingCatalog(session)) {
      return Response.json({ error: "Property not found" }, { status: 404 });
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
      return Response.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await Property.findById(propertyId)
      .populate("owner", "username email role")
      .lean();
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (
      isPaymentGatewayCheckoutEnabled() &&
      canUseOnlineCheckout(session, property)
    ) {
      return Response.json(
        {
          error:
            "Online payment is required for this listing. Use Reserve to complete checkout with the payment gateway.",
        },
        { status: 403 },
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
      return Response.json(
        { error: "Sign in to request a reservation" },
        { status: 401 },
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
      return Response.json(
        { error: result.error },
        { status: result.status || 400 },
      );
    }

    return Response.json(
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
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/bookings/request:", error);
    return Response.json(
      { error: "Could not create reservation" },
      { status: 500 },
    );
  }
}
