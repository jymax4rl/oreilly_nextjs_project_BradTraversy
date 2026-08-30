import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import { sendListingDecisionHostEmail } from "@/utils/email/sendListingModerationEmails";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const PATCH = async (request, { params }) => {
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: `Invalid property ID: ${id}` }, { status: 400 });
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!["approved", "rejected"].includes(status)) {
      return Response.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 },
      );
    }

    const oid = new mongoose.Types.ObjectId(id);
    const property = await Property.findById(oid).lean();
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const $set = {
      status,
      listingReviewedAt: new Date(),
    };

    if (mongoose.Types.ObjectId.isValid(String(session.user.id))) {
      $set.listingReviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }

    if (status === "rejected") {
      $set.rejectionReason =
        typeof rejectionReason === "string" && rejectionReason.trim()
          ? rejectionReason.trim().slice(0, 1000)
          : "Does not meet listing guidelines.";
    } else {
      $set.rejectionReason = null;
    }

    const result = await Property.updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // Notify host (non-blocking for response)
    let hostEmail = property.seller_info?.email;
    let hostName = property.seller_info?.name;
    if (property.owner && mongoose.Types.ObjectId.isValid(String(property.owner))) {
      const owner = await User.findById(property.owner)
        .select("email username")
        .lean();
      if (owner) {
        hostEmail = hostEmail || owner.email;
        hostName = hostName || owner.username;
      }
    }

    sendListingDecisionHostEmail({
      hostEmail,
      hostName,
      propertyName: property.name,
      propertyId: id,
      decision: status,
      rejectionReason: $set.rejectionReason,
    }).catch((err) =>
      console.error("Listing host notify warning:", err?.message || err),
    );

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
    return Response.json(
      { error: `Failed to update listing: ${error.message}` },
      { status: 500 },
    );
  }
};
