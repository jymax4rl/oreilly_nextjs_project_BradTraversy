import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import { bookingWithPolicyFlags } from "@/utils/bookings/mutateBooking";
import { buildGuestBookingsQuery } from "@/utils/bookings/guestBookingsList";

/**
 * GET /api/user/bookings — guest trips list (cookie or Bearer via getAuthFromRequest)
 *
 * Query:
 *   ?status=all|active|pending|confirmed|cancelled|upcoming|past
 *     - default all: confirmed|pending|cancelled (profile counts.bookings / my-bookings)
 *     - active: pending|confirmed
 *     - upcoming / past: same dialect as profile counts.bookingsUpcoming / bookingsPast
 *
 * Sorted by checkIn descending.
 * Response: { bookings, total, status }
 * Each item is bookingWithPolicyFlags (guest) plus a lean property card when found.
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const built = buildGuestBookingsQuery(session.user.id, {
      status: statusParam,
    });
    if (!built.ok) {
      return Response.json({ error: built.error }, { status: 400 });
    }

    const bookings = await Booking.find(built.query).sort(built.sort).lean();

    const propertyIds = [
      ...new Set(
        bookings.map((b) => String(b.propertyId)).filter(Boolean),
      ),
    ];

    const properties = propertyIds.length
      ? await Property.find({ _id: { $in: propertyIds } })
          .select("name images location type bookingPolicy slug")
          .lean()
      : [];

    const propertyById = new Map(
      properties.map((p) => [String(p._id), p]),
    );

    const items = bookings.map((b) => {
      const property = propertyById.get(String(b.propertyId));
      const item = bookingWithPolicyFlags(b, property, "guest");
      return {
        ...item,
        propertyName: item.propertyName || property?.name || null,
        property: property
          ? {
              _id: String(property._id),
              slug: property.slug || null,
              name: property.name,
              images: property.images,
              location: property.location,
              type: property.type,
            }
          : null,
      };
    });

    return Response.json({
      bookings: items,
      total: items.length,
      status: built.status,
    });
  } catch (error) {
    console.error("GET user bookings:", error);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
