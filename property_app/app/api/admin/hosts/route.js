import connectToDatabase from "@/config/database";
import HostApplication from "@/models/HostApplication";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 403 });
    }

    const applications = await HostApplication.find({ status: "pending" })
      .populate("user", "email username image")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ applications });
  } catch (error) {
    console.error("Failed to fetch host applications:", error);
    return new Response("Failed to fetch applications", { status: 500 });
  }
};
