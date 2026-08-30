import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import {
  normalizeRates,
  validateRatesPayload,
} from "@/utils/propertyRates";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const property = await getPropertyForApi(id);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const rates = normalizeRates(property.rates);

    return Response.json({
      propertyId: id,
      rates,
      currencyNote:
        "Rates are stored in USD. Guests see converted prices in their selected currency.",
    });
  } catch (error) {
    console.error("GET rates:", error);
    return Response.json({ error: "Failed to load rates" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
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
        { error: "Only the property owner can update rates" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = validateRatesPayload(body);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const updated = await Property.findByIdAndUpdate(
      id,
      { rates: validation.rates },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      propertyId: id,
      rates: normalizeRates(updated.rates),
    });
  } catch (error) {
    console.error("PATCH rates:", error);
    return Response.json({ error: "Failed to update rates" }, { status: 500 });
  }
}
