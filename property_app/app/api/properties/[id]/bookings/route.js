import connectToDatabase from "@/config/database";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";

const ALLOWED_STATUS = new Set(["pending", "confirmed", "cancelled"]);

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const property = await getPropertyForApi(id);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (!isPropertyOwner(property, session.user.id)) {
      return Response.json(
        { error: "Only the property owner can view bookings" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const query = {
      propertyId: new mongoose.Types.ObjectId(id),
    };

    if (statusFilter) {
      if (!ALLOWED_STATUS.has(statusFilter)) {
        return Response.json(
          { error: "Invalid status. Use pending, confirmed, or cancelled" },
          { status: 400 },
        );
      }
      query.status = statusFilter;
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 }).lean();

    return Response.json({
      propertyId: id,
      bookings: bookings.map((b) => ({
        _id: b._id.toString(),
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        guestId: b.guestId,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        transactionId: b.transactionId,
        propertyName: b.propertyName,
        amount: b.amount,
        currency: b.currency,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error) {
    console.error("GET bookings:", error);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
