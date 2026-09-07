import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import Property from "@/models/Property";
import { createCleaningJob } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { CLEANING_STATUSES, CLEANING_TYPES } from "@/utils/cleaners/constants";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("propertyId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const scope = searchParams.get("scope");

    const query = { hostId: session.user.id };
    if (status && CLEANING_STATUSES.includes(status)) query.status = status;
    if (propertyId) query.propertyId = propertyId;
    if (from || to) {
      query.scheduledDate = {};
      if (from) query.scheduledDate.$gte = from;
      if (to) query.scheduledDate.$lte = to;
    }
    if (scope === "history") {
      query.status = { $in: ["completed", "cancelled", "issue_reported"] };
    }
    if (scope === "requests") {
      query.status = "requested";
    }

    const jobs = await CleaningJob.find(query)
      .populate("cleanerId", "username image")
      .populate("requestedCleanerId", "username image")
      .populate("propertyId", "name location checkOutTime")
      .sort({ scheduledDate: 1, scheduledStartTime: 1 })
      .limit(500)
      .lean();

    const properties = await Property.find({ owner: session.user.id })
      .select("name location checkOutTime checkInTime")
      .sort({ name: 1 })
      .lean();

    return Response.json({
      jobs: jobs.map((job) => serializeCleaningJob(job)),
      properties: properties.map((property) => ({
        _id: String(property._id),
        name: property.name,
        city: property.location?.city || "",
        checkOutTime: property.checkOutTime || "11:00",
      })),
    });
  } catch (error) {
    console.error("GET /api/host/cleaning/jobs", error);
    return Response.json({ error: "Failed to load cleanings" }, { status: 500 });
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
    if (!body?.propertyId || !body?.scheduledDate) {
      return Response.json(
        { error: "Property and date are required" },
        { status: 400 },
      );
    }
    if (body.cleaningType && !CLEANING_TYPES.includes(body.cleaningType)) {
      return Response.json({ error: "Invalid cleaning type" }, { status: 400 });
    }

    const result = await createCleaningJob({
      hostId: session.user.id,
      propertyId: body.propertyId,
      scheduledDate: body.scheduledDate,
      scheduledStartTime: body.scheduledStartTime,
      scheduledEndTime: body.scheduledEndTime,
      estimatedDuration: body.estimatedDuration,
      cleaningType: body.cleaningType,
      hostNotes: body.hostNotes,
      cleanerId: body.cleanerId || null,
      requestCleaner: body.requestCleaner !== false && Boolean(body.cleanerId),
      reservationId: body.reservationId || null,
      agreedPrice: body.agreedPrice,
      currency: body.currency,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ job: serializeCleaningJob(result.job) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/host/cleaning/jobs", error);
    return Response.json({ error: "Failed to create cleaning" }, { status: 500 });
  }
}
