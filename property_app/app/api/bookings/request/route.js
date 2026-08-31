import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import User from "@/models/User";
import { createManualBookingRequest } from "@/utils/bookings/createManualBooking";
import { isPaymentGatewayCheckoutEnabled } from "@/utils/bookings/paymentMode";

/**
 * POST /api/bookings/request
 * Guest creates a pending reservation without paying online.
 * Host sees guest phone and arranges payment via messaging / call / WhatsApp.
 */
export async function POST(request) {
  try {
    if (isPaymentGatewayCheckoutEnabled()) {
      return Response.json(
        {
          error:
            "Online payment is required. Use Reserve to complete checkout with the payment gateway.",
        },
        { status: 403 },
      );
    }

    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return Response.json({ error: "Sign in to request a reservation" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      checkIn,
      checkOut,
      guestPhone,
      currency,
      amount,
    } = body || {};

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
      return Response.json({ error: "Sign in to request a reservation" }, { status: 401 });
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
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }

    return Response.json({
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
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings/request:", error);
    return Response.json({ error: "Could not create reservation" }, { status: 500 });
  }
}
