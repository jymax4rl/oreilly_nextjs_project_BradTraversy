import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getSessionFromRequest } from "@/utils/authSessionRoute";

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
    const validStatuses = ["pending", "approved", "rejected"];
    const filter = validStatuses.includes(statusFilter) ? statusFilter : "pending";

    // Treat legacy rows with missing status as approved once, so only
    // real submissions appear in the pending queue.
    await Property.updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } },
    );

    const query = { status: filter };

    const properties = await Property.find(query).sort({ createdAt: -1 }).lean();

    return Response.json(
      { properties },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Failed to fetch admin properties:", error);
    return new Response("Failed to fetch properties", { status: 500 });
  }
};
