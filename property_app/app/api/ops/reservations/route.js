import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import mongoose from "mongoose";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import {
  bookingSearchMongoOr,
  normalizeBookingSearchQuery,
} from "@/utils/bookings/bookingRefSearch";
import { isOpsStaff } from "@/utils/opsAuth";

export const dynamic = "force-dynamic";

const MAX_BOOKINGS = 400;
const ALLOWED_STATUS = new Set(["new", "pending", "confirmed", "cancelled", "all"]);

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function locationLabel(location) {
  if (!location) return "";
  return (
    [location.city, location.state, location.country].filter(Boolean).join(", ") ||
    ""
  );
}

/**
 * GET /api/ops/reservations
 * ?status=new|pending|confirmed|cancelled|all
 * ?q= guest / host / listing / ref
 * ?propertyId=
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return Response.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status") || "new";
    const statusFilter = ALLOWED_STATUS.has(statusRaw) ? statusRaw : "new";
    const propertyId = searchParams.get("propertyId");
    const searchNeedle = normalizeBookingSearchQuery(
      searchParams.get("q") || searchParams.get("query") || searchParams.get("ref"),
    );

    const query = {};
    if (propertyId) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return Response.json({ error: "Invalid listing id" }, { status: 400 });
      }
      query.propertyId = new mongoose.Types.ObjectId(propertyId);
    }

    if (statusFilter === "new" || statusFilter === "pending") {
      query.status = "pending";
    } else if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    const extra = [];

    if (searchNeedle) {
      const safe = escapeRegex(searchNeedle);
      const propertyMatch = {
        $or: [
          { name: { $regex: safe, $options: "i" } },
          { "location.city": { $regex: safe, $options: "i" } },
          { "location.country": { $regex: safe, $options: "i" } },
          { "seller_info.name": { $regex: safe, $options: "i" } },
          { "seller_info.email": { $regex: safe, $options: "i" } },
        ],
      };
      const matchedProperties = await Property.find(propertyMatch)
        .select("_id")
        .lean();
      const nameMatchIds = matchedProperties.map((p) => p._id);

      const txs = await Transaction.find({
        $or: [
          { tx_ref: { $regex: safe, $options: "i" } },
          { flw_ref: { $regex: safe, $options: "i" } },
        ],
      })
        .select("booking")
        .limit(80)
        .lean();
      const txBookingIds = txs.filter((tx) => tx.booking).map((tx) => tx.booking);

      extra.push({
        $or: [
          ...bookingSearchMongoOr(searchNeedle),
          { propertyName: { $regex: safe, $options: "i" } },
          ...(txBookingIds.length ? [{ _id: { $in: txBookingIds } }] : []),
          ...(nameMatchIds.length ? [{ propertyId: { $in: nameMatchIds } }] : []),
        ],
      });
    }

    if (extra.length) {
      query.$and = extra;
    }

    const [bookings, newCount, pendingCount, confirmedCount, cancelledCount, allCount] =
      await Promise.all([
        Booking.find(query).sort({ createdAt: -1 }).limit(MAX_BOOKINGS).lean(),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.countDocuments({ status: "cancelled" }),
        Booking.countDocuments({}),
      ]);

    const propertyIds = [
      ...new Set(bookings.map((b) => String(b.propertyId)).filter(Boolean)),
    ];
    const properties =
      propertyIds.length > 0
        ? await Property.find({
            _id: {
              $in: propertyIds.filter((id) => mongoose.Types.ObjectId.isValid(id)),
            },
          })
            .select("name location owner seller_info slug images")
            .lean()
        : [];
    const propertyById = new Map(properties.map((p) => [String(p._id), p]));

    const ownerIds = [
      ...new Set(
        properties
          .map((p) => p.owner)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id))),
      ),
    ];
    const owners =
      ownerIds.length > 0
        ? await User.find({ _id: { $in: ownerIds } })
            .select("email username")
            .lean()
        : [];
    const ownerById = Object.fromEntries(
      owners.map((u) => [u._id.toString(), u]),
    );

    return Response.json(
      {
        q: searchNeedle,
        status: statusFilter,
        counts: {
          new: Number(newCount) || 0,
          pending: Number(pendingCount) || 0,
          confirmed: Number(confirmedCount) || 0,
          cancelled: Number(cancelledCount) || 0,
          all: Number(allCount) || 0,
        },
        reservations: bookings.map((b) => {
          const property = propertyById.get(String(b.propertyId));
          const owner = property?.owner
            ? ownerById[String(property.owner)] || null
            : null;
          return {
            _id: String(b._id),
            status: b.status,
            paymentMode: b.paymentMode || null,
            listed: b.listed !== false,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            amount: b.amount,
            currency: b.currency,
            transactionId: b.transactionId ?? null,
            guestName: b.guestName || null,
            guestEmail: b.guestEmail || null,
            guestPhone: b.guestPhone || null,
            guestId: b.guestId || null,
            propertyId: String(b.propertyId),
            propertyName: b.propertyName || property?.name || "Untitled",
            propertyLocation: locationLabel(property?.location),
            hostName:
              owner?.username ||
              property?.seller_info?.name ||
              owner?.email ||
              property?.seller_info?.email ||
              null,
            hostEmail: owner?.email || property?.seller_info?.email || null,
            emailStatus: b.emailStatus || {},
            createdAt: b.createdAt,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("GET /api/ops/reservations:", error);
    return Response.json(
      { error: "Failed to load reservations" },
      { status: 500 },
    );
  }
}
