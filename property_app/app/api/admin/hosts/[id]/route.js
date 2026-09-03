import connectToDatabase from "@/config/database";
import HostApplication from "@/models/HostApplication";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import { isOpsStaff } from "@/utils/opsAuth";
import mongoose from "mongoose";
import { coerceStoredAddress } from "@/utils/address";

export const PATCH = async (request, { params }) => {
  // Next.js 15/16: params is a Promise and must be awaited
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);

    if (!session?.user || !isOpsStaff(session.user.role)) {
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

    const oid = new mongoose.Types.ObjectId(id);
    const application = await HostApplication.findById(oid).lean();

    if (!application) {
      return new Response("Application not found", { status: 404 });
    }

    // Status-only $set: document.save() re-runs nested AddressSchema validation
    // and Mongoose 9 pre-hooks, which is unnecessary for approve/reject.
    const $set = {
      status,
      reviewedAt: new Date(),
    };

    if (mongoose.Types.ObjectId.isValid(String(session.user.id))) {
      $set.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }

    if (
      status === "rejected" &&
      typeof rejectionReason === "string" &&
      rejectionReason.trim()
    ) {
      $set.rejectionReason = rejectionReason.trim().slice(0, 1000);
    }

    const result = await HostApplication.updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) {
      return new Response("Application not found", { status: 404 });
    }

    const userId = application.user;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      const userSet = {
        hostStatus: status === "approved" ? "verified" : "rejected",
        role: status === "approved" ? "host" : "guest",
      };
      const address = coerceStoredAddress(application.address);
      if (status === "approved" && address) {
        userSet.hostAddress = address;
      }
      const userResult = await User.updateOne({ _id: userId }, { $set: userSet });
      if (userResult.matchedCount === 0) {
        console.warn(
          "User not found for application:",
          id,
          "userId:",
          application.user,
        );
      }
    } else {
      console.warn(
        "User not found for application:",
        id,
        "userId:",
        application.user,
      );
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
