import connectToDatabase from "@/config/database";
import CreatorPartner from "@/models/CreatorPartner";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";

const PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "youtube",
  "multiple",
  "other",
  "",
]);
const STATUSES = new Set(["active", "paused", "archived"]);

/**
 * PATCH /api/host/creators/[id] — update partner fields / status
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid creator id" }, { status: 400 });
    }

    const partner = await CreatorPartner.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!partner) {
      return Response.json({ error: "Creator not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name || name.length < 2) {
        return Response.json({ error: "Creator name is required" }, { status: 400 });
      }
      partner.name = name.slice(0, 120);
    }
    if (body.email != null) {
      const email = String(body.email).trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: "Invalid email" }, { status: 400 });
      }
      partner.email = email.slice(0, 254);
    }
    if (body.platform != null) {
      const platform = String(body.platform).trim().toLowerCase();
      if (!PLATFORMS.has(platform)) {
        return Response.json({ error: "Invalid platform" }, { status: 400 });
      }
      partner.platform = platform;
    }
    if (body.profileUrl != null) {
      partner.profileUrl = String(body.profileUrl).trim().slice(0, 500);
    }
    if (body.notes != null) {
      partner.notes = String(body.notes).trim().slice(0, 2000);
    }
    if (body.status != null) {
      const status = String(body.status).trim();
      if (!STATUSES.has(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      partner.status = status;
    }

    await partner.save();

    return Response.json({
      id: String(partner._id),
      name: partner.name,
      email: partner.email,
      platform: partner.platform,
      profileUrl: partner.profileUrl,
      notes: partner.notes,
      status: partner.status,
    });
  } catch (error) {
    console.error("PATCH /api/host/creators/[id]:", error);
    return Response.json({ error: "Could not update creator" }, { status: 500 });
  }
}
