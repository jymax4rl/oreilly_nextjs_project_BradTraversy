import connectToDatabase from "@/config/database";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import { bookingWithPolicyFlags } from "@/utils/bookings/mutateBooking";
import { createManualBookingRequest } from "@/utils/bookings/createManualBooking";
import {
  bookingIdsFromTransactionRef,
  bookingSearchMongoOr,
  normalizeBookingSearchQuery,
} from "@/utils/bookings/bookingRefSearch";
import { revalidatePath } from "next/cache";

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

function looksLikeEmail(raw) {
  const value = String(raw || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * POST /api/properties/[id]/bookings
 * Host creates a reservation for a guest (WhatsApp required; name/email optional).
 */
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json(
        { error: verified.message },
        { status: verified.status },
      );
    }

    const property = await getPropertyForApi(id);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    if (!isPropertyOwner(property, session.user.id)) {
      return Response.json(
        { error: "Only the property owner can create a reservation" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const guestName = String(body?.guestName || "").trim() || undefined;
    const guestEmailRaw = String(body?.guestEmail || "").trim();
    const guestPhone = body?.guestPhone;
    const checkIn = body?.checkIn;
    const checkOut = body?.checkOut;

    if (guestEmailRaw && !looksLikeEmail(guestEmailRaw)) {
      return Response.json({ error: "Enter a valid guest email" }, { status: 400 });
    }

    let guestId = new mongoose.Types.ObjectId().toString();
    if (guestEmailRaw) {
      const escaped = guestEmailRaw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existing = await User.findOne({
        email: new RegExp(`^${escaped}$`, "i"),
      })
        .select("_id email")
        .lean();
      if (existing) {
        if (String(existing._id) === String(session.user.id)) {
          return Response.json(
            {
              error:
                "Use the guest’s details — you cannot create this stay as yourself",
            },
            { status: 400 },
          );
        }
        guestId = String(existing._id);
      }
    }

    const result = await createManualBookingRequest({
      propertyId: id,
      guestId,
      guestName,
      guestEmail: guestEmailRaw || undefined,
      guestPhone,
      checkIn,
      checkOut,
      createdByHost: true,
      status: "confirmed",
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: result.status || 400 },
      );
    }

    revalidatePath("/host");
    revalidatePath("/host/calendar");
    revalidatePath("/host/reservations");
    revalidatePath("/host/listings");

    return Response.json(
      {
        success: true,
        bookingId: String(result.booking._id),
        status: result.booking.status,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        guestPhone: result.booking.guestPhone,
        emails: result.emails
          ? {
              guestStatus: result.emails.guestStatus,
              hostStatus: result.emails.hostStatus,
            }
          : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST host booking:", error);
    return Response.json(
      { error: "Could not create reservation" },
      { status: 500 },
    );
  }
}

