import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { localTodayYmd } from "@/utils/host/reservationsCalendar";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "assigned";
    const query = {
      $or: [{ cleanerId: auth.user._id }, { requestedCleanerId: auth.user._id }],
    };
    if (scope === "requests") query.status = "requested";
    if (scope === "history") {
      query.status = { $in: ["completed", "cancelled", "issue_reported"] };
    }
    if (scope === "upcoming") {
      query.status = { $in: ["accepted", "scheduled", "en_route", "in_progress"] };
    }

    const jobs = await CleaningJob.find(query)
      .populate("propertyId", "name type location checkOutTime beds baths")
      .populate("reservationId", "checkOut")
      .sort({ scheduledDate: 1, scheduledStartTime: 1 })
      .limit(300)
      .lean();

    const serialized = jobs.map((job) =>
      serializeCleaningJob(job, { forCleaner: true }),
    );
    const today = localTodayYmd();

    return Response.json({
      today,
      jobs: serialized,
      groups: {
        today: serialized.filter(
          (job) =>
            job.scheduledDate === today &&
            !["completed", "cancelled", "declined"].includes(job.status),
        ),
        upcoming: serialized.filter(
          (job) =>
            job.scheduledDate > today &&
            ["accepted", "scheduled", "en_route"].includes(job.status),
        ),
        requests: serialized.filter((job) => job.status === "requested"),
        completed: serialized.filter((job) =>
          ["completed", "issue_reported"].includes(job.status),
        ),
      },
    });
  } catch (error) {
    console.error("GET /api/cleaners/jobs", error);
    return Response.json({ error: "Failed to load cleanings" }, { status: 500 });
  }
}
