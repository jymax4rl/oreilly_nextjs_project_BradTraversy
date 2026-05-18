import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    await connectToDatabase();

    const bookings = await Booking.find({
      guestId: String(session.user.id),
      status: { $in: ["confirmed", "pending"] },
    })
      .sort({ checkIn: -1 })
      .lean();

    const propertyIds = [
      ...new Set(bookings.map((b) => String(b.propertyId)).filter(Boolean)),
    ];

    const properties = propertyIds.length
      ? await Property.find({ _id: { $in: propertyIds } })
          .select("name images location type")
          .lean()
      : [];

    const propertyById = new Map(
      properties.map((p) => [String(p._id), p]),
    );

    return Response.json({
      bookings: bookings.map((b) => {
        const property = propertyById.get(String(b.propertyId));
        return {
          _id: b._id.toString(),
          propertyId: String(b.propertyId),
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
          transactionId: b.transactionId,
          amount: b.amount,
          currency: b.currency,
          propertyName: b.propertyName || property?.name,
          property: property
            ? {
                _id: String(property._id),
                name: property.name,
                type: property.type,
                images: property.images,
                location: property.location,
              }
            : null,
          createdAt: b.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET user bookings:", error);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
