import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import mongoose from "mongoose";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

async function deletePropertyMediaFiles(doc) {
  const imageDir = path.join(process.cwd(), "public/images/properties");
  const audioDir = path.join(process.cwd(), "public/audio/properties");

  for (const img of doc.images || []) {
    if (!img || typeof img !== "string") continue;
    const file = path.basename(img);
    try {
      await unlink(path.join(imageDir, file));
    } catch (e) {
      if (e?.code !== "ENOENT") {
        console.warn("Admin reject: could not delete image", file, e.message);
      }
    }
  }

  if (doc.audio && typeof doc.audio === "string") {
    const file = path.basename(doc.audio);
    try {
      await unlink(path.join(audioDir, file));
    } catch (e) {
      if (e?.code !== "ENOENT") {
        console.warn("Admin reject: could not delete audio", file, e.message);
      }
    }
  }
}

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
    const { status } = body;

    if (!["approved", "rejected"].includes(status)) {
      return new Response("Invalid status. Must be 'approved' or 'rejected'", {
        status: 400,
      });
    }

    const oid = new mongoose.Types.ObjectId(id);

    // Reject = delete listing entirely from DB (and uploaded media on disk)
    if (status === "rejected") {
      const doc = await Property.findById(oid).lean();
      if (!doc) {
        return new Response("Property not found", { status: 404 });
      }

      await User.updateMany({ bookmarks: oid }, { $pull: { bookmarks: oid } });

      await Transaction.updateMany(
        { property_id: oid },
        { $unset: { property_id: "" } },
      );

      await deletePropertyMediaFiles(doc);

      const del = await Property.deleteOne({ _id: oid });
      if (del.deletedCount === 0) {
        return new Response("Property not found", { status: 404 });
      }

      return Response.json(
        {
          success: true,
          message: "Listing removed",
          deleted: true,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // Approve: mark listing as approved for moderation
    const $set = {
      listingStatus: "approved",
      listingReviewedAt: new Date(),
      listingRejectionReason: null,
    };

    if (mongoose.Types.ObjectId.isValid(String(session.user.id))) {
      $set.listingReviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }

    const result = await Property.updateOne({ _id: oid }, { $set });

    if (result.matchedCount === 0) {
      return new Response("Property not found", { status: 404 });
    }

    return Response.json(
      {
        success: true,
        message: "Listing approved",
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
