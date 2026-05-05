import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import mongoose from "mongoose";

/** Do not cache: each ?status= must return a different list (App Router can cache GET otherwise). */
export const dynamic = "force-dynamic";

export const GET = async (request) => {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending";
    const valid = ["pending", "approved", "rejected"];
    const filter = valid.includes(statusFilter) ? statusFilter : "pending";

    let listingQuery;
    if (filter === "approved") {
      listingQuery = {
        $or: [
          { listingStatus: "approved" },
          { listingStatus: { $exists: false } },
          { listingStatus: null },
        ],
      };
    } else {
      listingQuery = { listingStatus: filter };
    }

    const [properties, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        Property.find(listingQuery).sort({ createdAt: -1 }).lean(),
        Property.countDocuments({ listingStatus: "pending" }),
        Property.countDocuments({
          $or: [
            { listingStatus: "approved" },
            { listingStatus: { $exists: false } },
            { listingStatus: null },
          ],
        }),
        Property.countDocuments({ listingStatus: "rejected" }),
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
            .select("email username image")
            .lean()
        : [];

    const ownerById = Object.fromEntries(
      owners.map((u) => [u._id.toString(), u]),
    );

    const withOwners = properties.map((p) => ({
      ...p,
      _id: p._id.toString(),
      ownerUser: p.owner
        ? ownerById[String(p.owner)] || null
        : null,
    }));

    return Response.json(
      {
        properties: withOwners,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
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
    return new Response("Failed to fetch listings", { status: 500 });
  }
};
