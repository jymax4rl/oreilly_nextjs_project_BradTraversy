import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import GuestBookingsList from "@/components/bookings/GuestBookingsList";
import {
  describeBookingPolicy,
  evaluateBookingPolicy,
} from "@/utils/bookings/bookingPolicy";
import { ArrowLeft, CalendarCheck } from "lucide-react";

export const metadata = {
  title: "My Bookings | Isisel",
  description: "Your confirmed reservations on Isisel",
  robots: { index: false, follow: false },
};

export default async function MyBookingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const confirmedBanner = params?.confirmed === "1";
  const reservedBanner = params?.reserved === "1";

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
            className="mt-6 inline-block rounded-xl bg-[#1b5c57] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#164a46]"
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
    status: { $in: ["confirmed", "pending", "cancelled"] },
  })
    .sort({ checkIn: -1 })
    .lean();

  // Hide older cancelled stays from the main list (keep recent 30 days).
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const visible = bookings.filter((b) => {
    if (b.status !== "cancelled") return true;
    const t = b.cancelledAt ? new Date(b.cancelledAt).getTime() : 0;
    return t >= cutoff;
  });

  const propertyIds = [
    ...new Set(visible.map((b) => String(b.propertyId)).filter(Boolean)),
  ];

  const properties = propertyIds.length
    ? await Property.find({ _id: { $in: propertyIds } })
        .select("name images location type bookingPolicy slug")
        .lean()
    : [];

  const propertyById = new Map(properties.map((p) => [String(p._id), p]));

  const items = visible.map((b) => {
    const property = propertyById.get(String(b.propertyId));
    const cancel = evaluateBookingPolicy(b, property, "cancel", new Date(), {
      actor: "guest",
    });
    const modify = evaluateBookingPolicy(b, property, "modify", new Date(), {
      actor: "guest",
    });
    return {
      _id: b._id.toString(),
      propertyId: String(b.propertyId),
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      paymentMode: b.paymentMode || null,
      guestPhone: b.guestPhone || null,
      transactionId: b.transactionId,
      amount: b.amount,
      currency: b.currency,
      modificationCount: b.modificationCount || 0,
      propertyName: b.propertyName || property?.name,
      policySummary: describeBookingPolicy(
        cancel.policy || modify.policy,
      ),
      actions: {
        cancel: {
          allowed: cancel.allowed,
          reason: cancel.reason || null,
          code: cancel.code || null,
        },
        modify: {
          allowed: modify.allowed,
          reason: modify.reason || null,
          code: modify.code || null,
        },
      },
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/properties"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#1b5c57]"
        >
          <ArrowLeft size={16} aria-hidden />
          Browse properties
        </Link>

        <div className="mb-8 flex items-start gap-3">
          <CalendarCheck
            className="mt-1 h-8 w-8 shrink-0 text-[#1b5c57]"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Confirmed and pending reservations for your trips. Change or cancel
              when the listing policy allows.
            </p>
          </div>
        </div>

        {confirmedBanner && (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            Payment confirmed — your booking is listed below. A confirmation
            email is sent automatically when email is configured.
          </div>
        )}

        {reservedBanner && (
          <div
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            Reservation requested — your dates are held. Message the host to
            arrange payment. A confirmation email is sent when email is
            configured.
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <CalendarCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-semibold text-slate-900">No bookings yet</p>
            <p className="mt-1 text-sm text-slate-500">
              When you reserve a stay, it will show up here.
            </p>
            <Link
              href="/properties"
              className="mt-5 inline-block rounded-xl bg-[#1b5c57] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#164a46]"
            >
              Find a place
            </Link>
          </div>
        ) : (
          <GuestBookingsList bookings={items} />
        )}
      </div>
    </div>
  );
}
