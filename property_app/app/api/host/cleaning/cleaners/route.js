import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import HostCleanerLink from "@/models/HostCleanerLink";
import CleanerProfile from "@/models/CleanerProfile";
import Property from "@/models/Property";
import { serializeHostCleanerLink, serializeCleanerProfile } from "@/utils/cleaners/serialize";
import { inviteOrRequestCleaner } from "@/utils/cleaners/inviteFlow";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const links = await HostCleanerLink.find({ hostId: session.user.id })
      .populate("cleanerId", "username email image")
      .populate("assignedPropertyIds", "name")
      .sort({ updatedAt: -1 })
      .lean();

    const cleanerIds = links
      .map((link) => link.cleanerId?._id)
      .filter(Boolean);
    const profiles = await CleanerProfile.find({
      userId: { $in: cleanerIds },
    }).lean();
    const profileByUser = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );

    const properties = await Property.find({ owner: session.user.id })
      .select("name")
      .sort({ name: 1 })
      .lean();

    return Response.json({
      cleaners: links.map((link) => ({
        ...serializeHostCleanerLink(link),
        profile: serializeCleanerProfile(
          profileByUser.get(String(link.cleanerId?._id)),
          link.cleanerId,
        ),
      })),
      properties: properties.map((property) => ({
        _id: String(property._id),
        name: property.name,
      })),
    });
  } catch (error) {
    console.error("GET /api/host/cleaning/cleaners", error);
    return Response.json({ error: "Failed to load cleaners" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const body = await request.json();
    const result = await inviteOrRequestCleaner({
      hostId: session.user.id,
      hostName: session.user.name,
      name: body?.name,
      email: body?.email,
      phone: body?.phone,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/host/cleaning/cleaners", error);
    return Response.json({ error: "Failed to invite cleaner" }, { status: 500 });
  }
}
