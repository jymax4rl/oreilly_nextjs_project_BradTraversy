import connectToDatabase from "@/config/database";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import { bookingWithPolicyFlags } from "@/utils/bookings/mutateBooking";
import {
  bookingIdsFromTransactionRef,
  bookingSearchMongoOr,
  normalizeBookingSearchQuery,
} from "@/utils/bookings/bookingRefSearch";

const ALLOWED_STATUS = new Set(["pending", "confirmed", "cancelled"]);

/**
 * GET /api/properties/[id]/bookings
 * ?status=pending|confirmed|cancelled
 * ?q= or ?ref= — Ref # / guest name / email
 */
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
    const searchNeedle = normalizeBookingSearchQuery(
      searchParams.get("q") || searchParams.get("ref"),
    );

    const propertyOid = new mongoose.Types.ObjectId(id);
    const query = { propertyId: propertyOid };

    if (statusFilter) {
      if (!ALLOWED_STATUS.has(statusFilter)) {
        return Response.json(
          { error: "Invalid status. Use pending, confirmed, or cancelled" },
          { status: 400 },
        );
      }
      query.status = statusFilter;
    }

    if (searchNeedle) {
      const txBookingIds = await bookingIdsFromTransactionRef(
        Transaction,
        searchNeedle,
        [propertyOid],
      );
      query.$or = [
        ...bookingSearchMongoOr(searchNeedle),
        ...(txBookingIds.length ? [{ _id: { $in: txBookingIds } }] : []),
      ];
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 }).lean();

    return Response.json({
      propertyId: id,
      q: searchNeedle,
      ref: searchNeedle,
      bookings: bookings.map((b) =>
        bookingWithPolicyFlags(b, property, "host"),
      ),
    });
  } catch (error) {
    console.error("GET bookings:", error);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
