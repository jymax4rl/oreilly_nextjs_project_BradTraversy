import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { isValidDateOnly } from "@/utils/availability/dateUtils";
import { bookingWithPolicyFlags } from "@/utils/bookings/mutateBooking";
import {
  bookingIdsFromTransactionRef,
  bookingSearchMongoOr,
  normalizeBookingSearchQuery,
} from "@/utils/bookings/bookingRefSearch";

const ALLOWED_STATUS = new Set([
  "pending",
  "confirmed",
  "cancelled",
  "active",
  "all",
  "completed",
  "unlisted",
]);

const MAX_RANGE_DAYS = 180;
const MAX_BOOKINGS = 1500;

function utcTodayYmd() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(from, to) {
  const a = Date.parse(`${from}T00:00:00.000Z`);
  const b = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * GET /api/host/reservations
 * ?status=confirmed|pending|cancelled|active|all|completed
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD — inclusive civil dates; overlap filter
 * ?propertyId=
 * ?q= or ?ref= — Ref # / guest / email / phone / property name
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
      .sort({ name: 1 })
      .lean();

    const slimProperties = properties.map((p) => ({
      id: String(p._id),
      name: p.name,
      city: p.location?.city || "",
      country: p.location?.country || "",
      image: p.images?.[0] || null,
    }));

    if (properties.length === 0) {
      return Response.json({ properties: [], bookings: [] });
    }

    let propertyIds = properties.map((p) => p._id);
    const propertyById = new Map(properties.map((p) => [String(p._id), p]));

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "active";
    const propertyId = searchParams.get("propertyId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const searchNeedle = normalizeBookingSearchQuery(
      searchParams.get("q") || searchParams.get("ref"),
    );

    if (propertyId) {
      if (!propertyById.has(propertyId)) {
        return Response.json({ error: "Unknown property" }, { status: 403 });
      }
      propertyIds = [new mongoose.Types.ObjectId(propertyId)];
    }

    if (!ALLOWED_STATUS.has(statusFilter)) {
      return Response.json(
        {
          error:
            "Invalid status. Use all, active, pending, confirmed, cancelled, completed, or unlisted",
        },
        { status: 400 },
      );
    }

    if ((from && !isValidDateOnly(from)) || (to && !isValidDateOnly(to))) {
      return Response.json({ error: "Invalid from/to date" }, { status: 400 });
    }
    if (from && to && daysBetween(from, to) > MAX_RANGE_DAYS) {
      return Response.json(
        { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days` },
        { status: 400 },
      );
    }

    const query = { propertyId: { $in: propertyIds } };
    const extra = [];

    if (statusFilter === "active") {
      query.status = { $in: ["pending", "confirmed"] };
    } else if (statusFilter === "unlisted") {
      query.listed = false;
      query.status = { $in: ["pending", "confirmed"] };
    } else if (statusFilter === "completed") {
      query.status = "confirmed";
      extra.push({ checkOut: { $lte: utcTodayYmd() } });
    } else if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    if (from && to) {
      extra.push({ checkIn: { $lte: to }, checkOut: { $gt: from } });
    }

    if (searchNeedle) {
      const nameMatchIds = properties
        .filter((p) =>
          String(p.name || "")
            .toLowerCase()
            .includes(searchNeedle.toLowerCase()),
        )
        .map((p) => p._id);
      const txBookingIds = await bookingIdsFromTransactionRef(
        Transaction,
        searchNeedle,
        propertyIds,
      );
      extra.push({
        $or: [
          ...bookingSearchMongoOr(searchNeedle),
          ...(txBookingIds.length ? [{ _id: { $in: txBookingIds } }] : []),
          ...(nameMatchIds.length ? [{ propertyId: { $in: nameMatchIds } }] : []),
        ],
      });
    }

    if (extra.length) {
      query.$and = extra;
    }

    const bookings = await Booking.find(query)
      .sort({ checkIn: 1 })
      .limit(MAX_BOOKINGS)
      .lean();

    const guestIds = [
      ...new Set(
        bookings
          .map((b) => b.guestId)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id)),
      ),
    ];
    const guests = guestIds.length
      ? await User.find({ _id: { $in: guestIds } })
          .select("image username")
          .lean()
      : [];
    const guestById = new Map(guests.map((g) => [String(g._id), g]));

    return Response.json({
      q: searchNeedle,
      ref: searchNeedle,
      from: from || null,
      to: to || null,
      properties: slimProperties,
      bookings: bookings.map((b) => {
        const property = propertyById.get(String(b.propertyId));
        const item = bookingWithPolicyFlags(b, property, "host");
        const guest = guestById.get(String(b.guestId));
        return {
          ...item,
          propertyName: item.propertyName || property?.name,
          guestImage: guest?.image || null,
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
