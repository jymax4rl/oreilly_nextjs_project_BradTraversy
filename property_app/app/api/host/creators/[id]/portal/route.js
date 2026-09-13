import CreatorPartner from "@/models/CreatorPartner";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import connectToDatabase from "@/config/database";

/**
 * POST /api/host/creators/[id]/portal
 * Ensure or rotate the creator read-only portal share link.
 * body: { rotate?: boolean }
 */
export async function POST(request, { params }) {
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
    if (body.rotate) {
      partner.rotatePortalToken();
    } else {
      partner.ensurePortalToken();
    }
    await partner.save();

    const path = `/creators/join/${partner.portalToken}`;
    return Response.json({
      portalToken: partner.portalToken,
      portalPath: path,
      portalUrl: path,
      joinPath: path,
      earningsPath: `/creators/portal/${partner.portalToken}`,
      rotatedAt: partner.portalTokenRotatedAt,
    });
  } catch (error) {
    console.error("POST /api/host/creators/[id]/portal:", error);
    return Response.json({ error: "Could not create portal link" }, { status: 500 });
  }
}
