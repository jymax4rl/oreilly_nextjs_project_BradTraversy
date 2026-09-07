import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import HostCleanerLink from "@/models/HostCleanerLink";
import { acceptRelationshipRequest } from "@/utils/cleaners/inviteFlow";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const links = await HostCleanerLink.find({ cleanerId: auth.user._id })
      .populate("hostId", "username image")
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json({
      links: links.map((link) => ({
        _id: String(link._id),
        status: link.status,
        host: link.hostId
          ? {
              _id: String(link.hostId._id),
              name: link.hostId.username,
              image: link.hostId.image,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET cleaner relationships", error);
    return Response.json({ error: "Failed to load hosts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const body = await request.json();
    const result = await acceptRelationshipRequest(body.linkId, auth.user._id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST cleaner relationship", error);
    return Response.json({ error: "Failed to accept request" }, { status: 500 });
  }
}
