import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  loadBookingWithProperty,
  assertGuestOwnership,
} from "@/utils/bookings/loadBookingContext";
import { bookingActionFlags } from "@/utils/bookings/bookingPolicy";
import { cancelBooking } from "@/utils/bookings/cancelBooking";
import { modifyBooking } from "@/utils/bookings/modifyBooking";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { bookingId } = await params;
    const ctx = await loadBookingWithProperty(bookingId);
    if (!ctx?.booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const owned = assertGuestOwnership(ctx.booking, session.user.id);
    if (!owned.ok) {
      return Response.json({ error: owned.error }, { status: owned.status });
    }

    const flags = bookingActionFlags(ctx.booking);

    return Response.json({
      booking: {
        _id: ctx.booking._id.toString(),
        propertyId: String(ctx.booking.propertyId),
        checkIn: ctx.booking.checkIn,
        checkOut: ctx.booking.checkOut,
        status: ctx.booking.status,
        version: ctx.booking.version ?? 0,
        amount: ctx.booking.amount,
        currency: ctx.booking.currency,
        propertyName: ctx.booking.propertyName || ctx.property?.name,
        ...flags,
      },
    });
  } catch (error) {
    console.error("GET user booking:", error);
    return Response.json({ error: "Failed to load booking" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { bookingId } = await params;
    const body = await request.json();
    const action = body?.action;
    const version = body?.version;

    if (action === "cancel") {
      const result = await cancelBooking({
        bookingId,
        actorId: session.user.id,
        actorRole: "guest",
        reason: body?.reason,
        expectedVersion: version,
      });
      if (!result.ok) {
        return Response.json(
          { error: result.error, code: result.code },
          { status: result.status },
        );
      }
      return Response.json({ success: true, ...result.booking });
    }

    if (action === "modify") {
      const result = await modifyBooking({
        bookingId,
        guestId: session.user.id,
        checkIn: body?.checkIn,
        checkOut: body?.checkOut,
        expectedVersion: version,
      });
      if (!result.ok) {
        return Response.json(
          { error: result.error, code: result.code },
          { status: result.status },
        );
      }
      return Response.json({
        success: true,
        booking: result.booking,
        priceDelta: result.priceDelta,
      });
    }

    return Response.json(
      { error: "action must be 'cancel' or 'modify'" },
      { status: 400 },
    );
  } catch (error) {
    console.error("PATCH user booking:", error);
    return Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
