import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import BookingCard from "@/components/bookings/BookingCard";
import { ArrowLeft, CalendarCheck } from "lucide-react";

export const metadata = {
  title: "My Bookings | Kama Properties",
  description: "Your confirmed reservations on Kama Properties",
};

export default async function MyBookingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const confirmedBanner = params?.confirmed === "1";

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-20">
        <div className="max-w-md text-center">
          <CalendarCheck className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900">Sign in required</h1>
          <p className="mt-2 text-slate-600">
            Sign in to view your reservations.
          </p>
          <Link
            href="/api/auth/signin?callbackUrl=%2Fmy-bookings"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
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

  const propertyById = new Map(properties.map((p) => [String(p._id), p]));

  const items = bookings.map((b) => {
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
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/properties"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} aria-hidden />
          Browse properties
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-indigo-600" aria-hidden />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My bookings</h1>
            <p className="mt-1 text-slate-500">
              {items.length} reservation{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {confirmedBanner && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Payment successful — your booking is confirmed. Check your inbox for
            the confirmation email from Kama Properties.
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-900">No bookings yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-slate-500">
              When you complete a reservation, it will appear here.
            </p>
            <Link
              href="/properties"
              className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Find a stay
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((booking) => (
              <li key={booking._id}>
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
