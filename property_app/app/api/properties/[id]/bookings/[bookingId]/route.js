import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  assertVerifiedHost,
  isPropertyOwner,
} from "@/utils/availability/propertyAccess";
import { loadBookingById } from "@/utils/bookings/loadBookingContext";
import { cancelBooking } from "@/utils/bookings/cancelBooking";

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const { id: propertyId, bookingId } = await params;

    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const property = await getPropertyForApi(propertyId);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    if (!isPropertyOwner(property, session.user.id)) {
      return Response.json(
        { error: "Only the property owner can manage bookings" },
        { status: 403 },
      );
    }

    const booking = await loadBookingById(bookingId);
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    if (String(booking.propertyId) !== String(propertyId)) {
      return Response.json(
        { error: "Booking does not belong to this property" },
        { status: 400 },
      );
    }

    const body = await request.json();
    if (body?.action !== "cancel") {
      return Response.json(
        { error: "Hosts can only cancel reservations in this version" },
        { status: 400 },
      );
    }

    const result = await cancelBooking({
      bookingId,
      actorId: session.user.id,
      actorRole: "host",
      reason: body?.reason,
      expectedVersion: body?.version,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return Response.json({ success: true, ...result.booking });
  } catch (error) {
    console.error("PATCH host booking:", error);
    return Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
