import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import {
  approvedListingQuery,
  pendingModerationQueueQuery,
} from "@/utils/listingApproval";
import { isOpsStaff } from "@/utils/opsAuth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/** Max lookback the overview recent-listings panel supports (minutes). */
const MAX_LOOKBACK_MINUTES = 60;

/**
 * Prefer moderation-submit time for the ops queue; fall back to createdAt for
 * legacy docs that never set listingModerationRequestedAt.
 */
function listingSubmittedAt(property) {
  const raw = property.listingModerationRequestedAt || property.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Ops home metrics + recent listings (FIFO within lookback).
 * Always returns up to the last 60 minutes of listings so the client can
 * filter by slider without refetching. `?sinceMinutes=` is accepted but
 * clamped to [0, 60] and only used as a hint for empty responses.
 */
export const GET = async (request) => {
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
    const rawSince = Number(searchParams.get("sinceMinutes"));
    const sinceMinutes = Number.isFinite(rawSince)
      ? Math.min(MAX_LOOKBACK_MINUTES, Math.max(0, Math.floor(rawSince)))
      : MAX_LOOKBACK_MINUTES;

    const windowStart = new Date(
      Date.now() - MAX_LOOKBACK_MINUTES * 60 * 1000,
    );
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      recentCandidates,
      activeListings,
      pendingReviews,
      transactions30d,
    ] = await Promise.all([
      Property.find({
        $or: [
          { listingModerationRequestedAt: { $gte: windowStart } },
          { createdAt: { $gte: windowStart } },
        ],
      })
        .select(
          "name type status location owner seller_info listingModerationRequestedAt createdAt",
        )
        .lean(),
      Property.countDocuments(approvedListingQuery()),
      Property.countDocuments(pendingModerationQueueQuery()),
      Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Normalize submit time, drop anything older than the max window, FIFO (oldest first).
    const withSubmit = recentCandidates
      .map((p) => {
        const submittedAt = listingSubmittedAt(p);
        if (!submittedAt || submittedAt < windowStart) return null;
        return { property: p, submittedAt };
      })
      .filter(Boolean)
      .sort((a, b) => a.submittedAt - b.submittedAt);

    const ownerIds = [
      ...new Set(
        withSubmit
          .map(({ property: p }) => p.owner)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id))),
      ),
    ];

    const owners =
      ownerIds.length > 0
        ? await User.find({ _id: { $in: ownerIds } })
            .select("email username image banned")
            .lean()
        : [];

    const ownerById = Object.fromEntries(
      owners.map((u) => [u._id.toString(), u]),
    );

    const listings = withSubmit.map(({ property: p, submittedAt }) => ({
      _id: p._id.toString(),
      name: p.name || "Untitled",
      type: p.type || null,
      status: p.status || null,
      location: {
        city: p.location?.city || null,
        state: p.location?.state || null,
        country: p.location?.country || null,
      },
      submittedAt: submittedAt.toISOString(),
      owner: p.owner ? String(p.owner) : null,
      ownerUser: p.owner ? ownerById[String(p.owner)] || null : null,
      seller_info: p.seller_info
        ? { name: p.seller_info.name, email: p.seller_info.email }
        : null,
    }));

    return Response.json(
      {
        metrics: {
          activeListings: Number(activeListings) || 0,
          pendingReviews: Number(pendingReviews) || 0,
          transactions30d: Number(transactions30d) || 0,
        },
        listings,
        windowMinutesMax: MAX_LOOKBACK_MINUTES,
        /** Echo of request clamp; 0 means client should show an empty “window off” list. */
        sinceMinutes,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch ops overview:", error);
    return Response.json(
      { error: "Failed to fetch ops overview" },
      { status: 500 },
    );
  }
};
