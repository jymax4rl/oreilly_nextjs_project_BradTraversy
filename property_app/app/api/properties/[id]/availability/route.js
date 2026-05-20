import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import {
  getAvailabilityPayload,
  updatePropertyAvailability,
} from "@/utils/availability/availabilityService";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const property = await getPropertyForApi(id);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const isOwner = isPropertyOwner(property, session?.user?.id);

    const payload = await getAvailabilityPayload(id, { isOwner });
    return Response.json(payload);
  } catch (error) {
    console.error("GET availability:", error);
    return Response.json({ error: "Failed to load availability" }, { status: 500 });
  }
}

/**
 * PUT /api/properties/[id]/availability
 * Owner-only: update host calendar blocks (and optional default/custom rates).
 * Loads confirmed bookings, rejects overlapping host blocks (UTC date-only ranges),
 * then applies an atomic MongoDB upsert.
 */
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const property = await getPropertyForApi(id);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    if (!isPropertyOwner(property, session.user.id)) {
      return Response.json(
        { error: "Only the property owner can update availability" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = await updatePropertyAvailability(id, property.owner, body);

    if (!result.ok) {
      return Response.json(
        { error: result.error, details: result.details },
        { status: result.status },
      );
    }

    return Response.json(result.payload);
  } catch (error) {
    console.error("PUT availability:", error);
    return Response.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
