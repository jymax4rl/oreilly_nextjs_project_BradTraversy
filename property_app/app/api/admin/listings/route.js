import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import {
  hiddenListingQuery,
  pendingModerationQueueQuery,
  publicListingQuery,
} from "@/utils/listingApproval";
import { isOpsStaff } from "@/utils/opsAuth";
import mongoose from "mongoose";

/** Do not cache: each ?status= must return a different list. */
export const dynamic = "force-dynamic";

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
    const statusFilter = searchParams.get("status") || "pending";
    const valid = ["pending", "approved", "rejected", "hidden"];
    const filter = valid.includes(statusFilter) ? statusFilter : "pending";

    let listingQuery;
    if (filter === "approved") {
      listingQuery = publicListingQuery();
    } else if (filter === "hidden") {
      listingQuery = hiddenListingQuery();
    } else if (filter === "pending") {
      listingQuery = pendingModerationQueueQuery();
    } else {
      listingQuery = { status: "rejected" };
    }

    const pendingQueue = pendingModerationQueueQuery();

    const [properties, pendingCount, approvedCount, rejectedCount, hiddenCount] =
      await Promise.all([
        Property.find(listingQuery).sort({ createdAt: -1 }).lean(),
        Property.countDocuments(pendingQueue),
        Property.countDocuments(publicListingQuery()),
        Property.countDocuments({ status: "rejected" }),
        Property.countDocuments(hiddenListingQuery()),
      ]);

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
            .select("email username image banned")
            .lean()
        : [];

    const ownerById = Object.fromEntries(
      owners.map((u) => [u._id.toString(), u]),
    );

    const withOwners = properties.map((p) => ({
      ...p,
      _id: p._id.toString(),
      listed: p.listed !== false,
      ownerUser: p.owner ? ownerById[String(p.owner)] || null : null,
    }));

    return Response.json(
      {
        properties: withOwners,
        counts: {
          pending: Number(pendingCount) || 0,
          approved: Number(approvedCount) || 0,
          rejected: Number(rejectedCount) || 0,
          hidden: Number(hiddenCount) || 0,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch listings for admin:", error);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
};
