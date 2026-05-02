import connectToDatabase from "@/config/database";
import HostApplication from "@/models/HostApplication";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const PATCH = async (request, { params }) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    const { id } = params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!["approved", "rejected"].includes(status)) {
      return new Response("Invalid status. Must be 'approved' or 'rejected'", {
        status: 400,
      });
    }

    const application = await HostApplication.findById(id);
    if (!application) {
      return new Response("Application not found", { status: 404 });
    }

    if (application.status !== "pending") {
      return new Response("Application has already been reviewed", {
        status: 400,
      });
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = session.user.id;
    if (status === "rejected" && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    const user = await User.findById(application.user);
    if (user) {
      user.hostStatus = status === "approved" ? "verified" : "rejected";
      await user.save();
    }

    return Response.json({
      success: true,
      message: `Host application ${status}`,
    });
  } catch (error) {
    console.error("Admin hosts PATCH error:", error);
    return new Response("Failed to update application", { status: 500 });
  }
};
