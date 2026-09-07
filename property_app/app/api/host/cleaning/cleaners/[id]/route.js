import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import HostCleanerLink from "@/models/HostCleanerLink";
import Property from "@/models/Property";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const link = await HostCleanerLink.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!link) {
      return Response.json({ error: "Cleaner relationship not found" }, { status: 404 });
    }

    const body = await request.json();
    if (Array.isArray(body.assignedPropertyIds)) {
      const owned = await Property.find({
        owner: session.user.id,
        _id: { $in: body.assignedPropertyIds },
      }).select("_id");
      link.assignedPropertyIds = owned.map((property) => property._id);
    }
    if (body.status === "active" || body.status === "inactive") {
      link.status = body.status;
    }
    await link.save();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/host/cleaning/cleaners/[id]", error);
    return Response.json({ error: "Failed to update cleaner" }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const link = await HostCleanerLink.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!link) {
      return Response.json({ error: "Cleaner relationship not found" }, { status: 404 });
    }
    link.status = "inactive";
    await link.save();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/host/cleaning/cleaners/[id]", error);
    return Response.json({ error: "Failed to remove cleaner" }, { status: 500 });
  }
}
