import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const query = { hostId: session.user.id, status: { $ne: "cancelled" } };
    if (from || to) {
      query.scheduledDate = {};
      if (from) query.scheduledDate.$gte = from;
      if (to) query.scheduledDate.$lte = to;
    }

    const jobs = await CleaningJob.find(query)
      .populate("cleanerId", "username image")
      .populate("propertyId", "name")
      .sort({ scheduledDate: 1, scheduledStartTime: 1 })
      .limit(400)
      .lean();

    return Response.json({
      jobs: jobs.map((job) => serializeCleaningJob(job)),
    });
  } catch (error) {
    console.error("GET /api/host/cleaning/calendar", error);
    return Response.json({ error: "Failed to load calendar" }, { status: 500 });
  }
}
