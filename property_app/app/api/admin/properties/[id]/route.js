import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const PATCH = async (request, { params }) => {
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response(`Invalid property ID: ${id}`, { status: 400 });
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!["approved", "rejected"].includes(status)) {
      return new Response("Invalid status. Must be 'approved' or 'rejected'", {
        status: 400,
      });
    }

    const $set = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason || null : null,
      reviewedAt: new Date(),
    };

    if (mongoose.Types.ObjectId.isValid(String(session.user.id))) {
      $set.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }

    const result = await Property.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set },
    );

    if (result.matchedCount === 0) {
      return new Response("Property not found", { status: 404 });
    }

    return Response.json(
      { success: true, message: `Property ${status}` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to update admin property status:", error);
    return new Response(`Failed to update property: ${error.message}`, {
      status: 500,
    });
  }
};
