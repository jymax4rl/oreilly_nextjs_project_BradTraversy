import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  bookingWithPolicyFlags,
  cancelBookingRecord,
  isValidObjectId,
  modifyBookingDates,
} from "@/utils/bookings/mutateBooking";
import { describeBookingPolicy } from "@/utils/bookings/bookingPolicy";

async function loadGuestBooking(bookingId, sessionUserId) {
  if (!isValidObjectId(bookingId)) return { error: "Invalid booking id", status: 400 };
  const booking = await Booking.findById(bookingId);
  if (!booking) return { error: "Booking not found", status: 404 };
  if (String(booking.guestId) !== String(sessionUserId)) {
    return { error: "Forbidden", status: 403 };
  }
  const property = await Property.findById(booking.propertyId)
    .select("name images location bookingPolicy owner seller_info")
    .lean();
  return { booking, property };
}

/**
 * GET /api/user/bookings/[bookingId] — guest view + policy action flags
 */
export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { bookingId } = await params;
    const loaded = await loadGuestBooking(bookingId, session.user.id);
    if (loaded.error) {
      return Response.json({ error: loaded.error }, { status: loaded.status });
    }

    const item = bookingWithPolicyFlags(loaded.booking, loaded.property, "guest");
    return Response.json({
      booking: item,
      policySummary: describeBookingPolicy(item.policy),
    });
  } catch (error) {
    console.error("GET user booking:", error);
    return Response.json({ error: "Failed to load booking" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/bookings/[bookingId] — guest modify dates (policy-gated)
 * Body: { checkIn, checkOut }
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { bookingId } = await params;
    const loaded = await loadGuestBooking(bookingId, session.user.id);
    if (loaded.error) {
      return Response.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json().catch(() => ({}));
    const result = await modifyBookingDates({
      bookingId,
      actor: "guest",
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      property: loaded.property,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, code: result.code, policy: result.policy },
        { status: result.status || 400 },
      );
    }

    return Response.json({
      success: true,
      booking: bookingWithPolicyFlags(result.booking, loaded.property, "guest"),
      nights: result.nights,
      emails: result.emails || null,
    });
  } catch (error) {
    console.error("PATCH user booking:", error);
    return Response.json({ error: "Failed to modify booking" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/bookings/[bookingId] — guest cancel (policy-gated)
 * Body optional: { reason }
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { bookingId } = await params;
    const loaded = await loadGuestBooking(bookingId, session.user.id);
    if (loaded.error) {
      return Response.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json().catch(() => ({}));
    const result = await cancelBookingRecord({
      bookingId,
      actor: "guest",
      actorUserId: session.user.id,
      reason: body.reason,
      property: loaded.property,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, code: result.code, policy: result.policy },
        { status: result.status || 400 },
      );
    }

    return Response.json({
      success: true,
      booking: bookingWithPolicyFlags(result.booking, loaded.property, "guest"),
      refundEligible: result.refundEligible,
      emails: result.emails || null,
    });
  } catch (error) {
    console.error("DELETE user booking:", error);
    return Response.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
