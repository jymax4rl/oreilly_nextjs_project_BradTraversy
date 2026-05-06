import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const GET = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending";

    const validStatuses = ["pending", "approved", "rejected"];
    const filter = validStatuses.includes(statusFilter) ? statusFilter : "pending";

    // Properties that have no status field yet are treated as "pending"
    const query =
      filter === "pending"
        ? { $or: [{ status: "pending" }, { status: { $exists: false } }] }
        : { status: filter };

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const serialized = properties.map((p) => ({
      ...p,
      _id: p._id.toString(),
      owner: p.owner?.toString?.() || p.owner,
      reviewedBy: p.reviewedBy?.toString?.() || p.reviewedBy,
    }));

    return Response.json({ properties: serialized });
  } catch (error) {
    console.error("Failed to fetch properties for admin:", error);
    return new Response("Failed to fetch properties", { status: 500 });
  }
};
