import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import { getOrCreatePropertySettings } from "@/utils/cleaners/jobs";
import { CLEANING_TYPES } from "@/utils/cleaners/constants";

export async function GET(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }
    const result = await getOrCreatePropertySettings(id, session.user.id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({
      settings: {
        ...result.settings,
        _id: String(result.settings._id),
        propertyId: String(result.settings.propertyId),
      },
      property: {
        _id: String(result.property._id),
        name: result.property.name,
      },
    });
  } catch (error) {
    console.error("GET property cleaning settings", error);
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }
    const result = await getOrCreatePropertySettings(id, session.user.id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const update = {};
    if (typeof body.autoCreateOnCheckout === "boolean") {
      update.autoCreateOnCheckout = body.autoCreateOnCheckout;
    }
    if (body.defaultType && CLEANING_TYPES.includes(body.defaultType)) {
      update.defaultType = body.defaultType;
    }
    if (body.estimatedMinutes != null) {
      update.estimatedMinutes = Math.min(720, Math.max(30, Number(body.estimatedMinutes)));
    }
    if (body.instructions != null) {
      update.instructions = String(body.instructions).slice(0, 4000);
    }
    if (Array.isArray(body.checklist)) {
      update.checklist = body.checklist
        .filter((item) => item?.label)
        .slice(0, 40)
        .map((item, index) => ({
          key: String(item.key || `item-${index}`).slice(0, 40),
          label: String(item.label).slice(0, 160),
        }));
    }

    const settings = await PropertyCleaningSettings.findOneAndUpdate(
      { propertyId: id, hostId: session.user.id },
      { $set: update },
      { new: true },
    ).lean();

    return Response.json({ settings });
  } catch (error) {
    console.error("PUT property cleaning settings", error);
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
