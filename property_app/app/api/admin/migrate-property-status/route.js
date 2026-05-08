import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";

/**
 * POST /api/admin/migrate-property-status
 *
 * One-time migration: sets status="approved" on every Property document
 * that was created before the status field was added (i.e. has no status).
 * Admin-only. Safe to call multiple times (idempotent).
 */
export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 403 });
    }

    const result = await mongoose.connection
      .collection("Properties")
      .updateMany(
        { status: { $exists: false } },
        { $set: { status: "approved" } }
      );

    return Response.json({
      success: true,
      updated: result.modifiedCount,
      message: `Stamped ${result.modifiedCount} existing properties as "approved".`,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(`Migration failed: ${error.message}`, { status: 500 });
  }
};
