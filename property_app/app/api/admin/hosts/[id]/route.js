import connectToDatabase from "@/config/database";
import HostApplication from "@/models/HostApplication";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";

export const PATCH = async (request, context) => {
  // Next.js 15/16: params is a Promise and must be awaited
  const { id } = await context.params;

  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    // Validate ObjectId format before querying
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response(`Invalid application ID: ${id}`, { status: 400 });
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!["approved", "rejected"].includes(status)) {
      return new Response("Invalid status. Must be 'approved' or 'rejected'", {
        status: 400,
      });
    }

    const application = await HostApplication.findById(
      new mongoose.Types.ObjectId(id),
    );

    if (!application) {
      return new Response("Application not found", { status: 404 });
    }

    // Update application
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    if (status === "rejected" && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    // Update user role/hostStatus
    const userId =
      application.user instanceof mongoose.Types.ObjectId
        ? application.user
        : new mongoose.Types.ObjectId(application.user);

    const user = await User.findById(userId);

    if (user) {
      user.hostStatus = status === "approved" ? "verified" : "rejected";
      user.role = status === "approved" ? "host" : "guest";
      await user.save();
    } else {
      console.warn("User not found for application:", id, "userId:", application.user);
    }

    return Response.json({
      success: true,
      message: `Host application ${status}`,
    });
  } catch (error) {
    console.error("Admin hosts PATCH error:", error);
    return new Response(`Failed to update application: ${error.message}`, {
      status: 500,
    });
  }
};
