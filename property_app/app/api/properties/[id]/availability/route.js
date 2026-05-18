import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import {
  ensurePropertyAvailability,
  getAvailabilityPayload,
  validateHostBlocks,
  validateCustomDayRates,
  getConfirmedBookings,
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

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const hostCheck = await (async () => {
      const session = await getServerSession(authOptions);
      const verified = assertVerifiedHost(session);
      if (!verified.ok) return verified;

      const property = await getPropertyForApi(id);
      if (!property) {
        return { ok: false, status: 404, message: "Property not found" };
      }
      if (!isPropertyOwner(property, session.user.id)) {
        return { ok: false, status: 403, message: "Only the property owner can update availability" };
      }
      return { ok: true, session, property };
    })();

    if (!hostCheck.ok) {
      return Response.json({ error: hostCheck.message }, { status: hostCheck.status });
    }

    const body = await request.json();
    const hostBlocks = body.hostBlocks ?? [];
    const defaultAvailability = body.defaultAvailability;
    const customDayRatesInput = body.customDayRates;

    if (
      defaultAvailability != null &&
      defaultAvailability !== "open" &&
      defaultAvailability !== "closed"
    ) {
      return Response.json(
        { error: "defaultAvailability must be 'open' or 'closed'" },
        { status: 400 },
      );
    }

    const confirmedBookings = await getConfirmedBookings(id);
    const { errors, normalized } = validateHostBlocks(hostBlocks, confirmedBookings);
    if (errors.length) {
      return Response.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    let normalizedCustom = null;
    if (customDayRatesInput != null) {
      const customResult = validateCustomDayRates(customDayRatesInput);
      if (customResult.errors.length) {
        return Response.json(
          { error: "Validation failed", details: customResult.errors },
          { status: 400 },
        );
      }
      normalizedCustom = customResult.normalized;
    }

    const availability = await ensurePropertyAvailability(id);
    availability.hostBlocks = normalized;
    if (defaultAvailability != null) {
      availability.defaultAvailability = defaultAvailability;
    }
    if (normalizedCustom != null) {
      availability.customDayRates = normalizedCustom;
    }
    await availability.save();

    const payload = await getAvailabilityPayload(id, { isOwner: true });
    return Response.json({
      success: true,
      ...payload,
    });
  } catch (error) {
    console.error("PUT availability:", error);
    return Response.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
