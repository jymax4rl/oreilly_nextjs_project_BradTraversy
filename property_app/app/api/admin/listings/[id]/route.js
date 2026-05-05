import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";

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

    const property = await Property.findById(
      new mongoose.Types.ObjectId(id),
    );

    if (!property) {
      return new Response("Property not found", { status: 404 });
    }

    property.listingStatus = status;
    property.listingReviewedAt = new Date();
    property.listingReviewedBy = new mongoose.Types.ObjectId(session.user.id);
    if (status === "approved") {
      property.listingRejectionReason = undefined;
    } else if (status === "rejected" && rejectionReason) {
      property.listingRejectionReason = rejectionReason;
    } else if (status === "rejected") {
      property.listingRejectionReason = undefined;
    }

    await property.save();

    return Response.json({
      success: true,
      message: `Listing ${status}`,
    });
  } catch (error) {
    console.error("Admin listing PATCH error:", error);
    return new Response(`Failed to update listing: ${error.message}`, {
      status: 500,
    });
  }
};
