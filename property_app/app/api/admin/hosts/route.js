import connectToDatabase from "@/config/database";
import HostApplication from "@/models/HostApplication";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const GET = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 403 });
    }

    // Read the ?status= query param — defaults to "pending"
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending";

    const validStatuses = ["pending", "approved", "rejected"];
    const filter = validStatuses.includes(statusFilter) ? statusFilter : "pending";

    const applications = await HostApplication.find({ status: filter })
      .populate("user", "email username image")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ applications });
  } catch (error) {
    console.error("Failed to fetch host applications:", error);
    return new Response("Failed to fetch applications", { status: 500 });
  }
};
