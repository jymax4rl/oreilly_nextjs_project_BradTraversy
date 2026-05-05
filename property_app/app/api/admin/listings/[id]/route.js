import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const PATCH = async (request, { params }) => {
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

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

    const oid = new mongoose.Types.ObjectId(id);

    const $set = {
      listingStatus: status,
      listingReviewedAt: new Date(),
    };

    if (mongoose.Types.ObjectId.isValid(String(session.user.id))) {
      $set.listingReviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }

    if (status === "approved") {
      $set.listingRejectionReason = null;
    } else {
      $set.listingRejectionReason = rejectionReason || null;
    }

    // $set + direct update so legacy documents get new fields even if a doc instance would skip them
    const result = await Property.updateOne(
      { _id: oid },
      { $set },
    );

    if (result.matchedCount === 0) {
      return new Response("Property not found", { status: 404 });
    }

    return Response.json(
      {
        success: true,
        message: `Listing ${status}`,
        modifiedCount: result.modifiedCount,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin listing PATCH error:", error);
    return new Response(`Failed to update listing: ${error.message}`, {
      status: 500,
    });
  }
};
