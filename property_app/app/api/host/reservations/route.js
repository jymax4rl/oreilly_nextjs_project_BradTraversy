import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { bookingWithPolicyFlags } from "@/utils/bookings/mutateBooking";
import {
  bookingIdsFromTransactionRef,
  bookingSearchMongoOr,
  normalizeBookingSearchQuery,
} from "@/utils/bookings/bookingRefSearch";

const ALLOWED_STATUS = new Set(["pending", "confirmed", "cancelled", "active"]);

/**
 * GET /api/host/reservations
 * ?status=confirmed|pending|cancelled|active
 * ?q= or ?ref= — Ref # / transaction id / guest name / email (partial, case-insensitive)
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const properties = await Property.find({ owner: session.user.id })
      .select("_id name images location bookingPolicy")
      .lean();

    if (properties.length === 0) {
      return Response.json({ properties: [], bookings: [] });
    }

    const propertyIds = properties.map((p) => p._id);
    const propertyById = new Map(properties.map((p) => [String(p._id), p]));

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "active";
    const searchNeedle = normalizeBookingSearchQuery(
      searchParams.get("q") || searchParams.get("ref"),
    );

    const query = { propertyId: { $in: propertyIds } };
    if (statusFilter === "active") {
      query.status = { $in: ["pending", "confirmed"] };
    } else if (ALLOWED_STATUS.has(statusFilter)) {
      query.status = statusFilter;
    } else {
      return Response.json(
        { error: "Invalid status. Use active, pending, confirmed, or cancelled" },
        { status: 400 },
      );
    }

    if (searchNeedle) {
      const txBookingIds = await bookingIdsFromTransactionRef(
        Transaction,
        searchNeedle,
        propertyIds,
      );
      query.$or = [
        ...bookingSearchMongoOr(searchNeedle),
        ...(txBookingIds.length ? [{ _id: { $in: txBookingIds } }] : []),
      ];
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 }).lean();

    return Response.json({
      q: searchNeedle,
      ref: searchNeedle,
      bookings: bookings.map((b) => {
        const property = propertyById.get(String(b.propertyId));
        const item = bookingWithPolicyFlags(b, property, "host");
        return {
          ...item,
          propertyName: item.propertyName || property?.name,
          property: property
            ? {
                _id: String(property._id),
                name: property.name,
                images: property.images,
                location: property.location,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("GET host reservations:", error);
    return Response.json({ error: "Failed to load reservations" }, { status: 500 });
  }
}
