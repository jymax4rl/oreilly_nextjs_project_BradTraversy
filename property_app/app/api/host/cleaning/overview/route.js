import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import HostCleanerLink from "@/models/HostCleanerLink";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { localTodayYmd } from "@/utils/host/reservationsCalendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const hostId = session.user.id;
    const today = localTodayYmd();
    const jobs = await CleaningJob.find({ hostId })
      .populate("cleanerId", "username image")
      .populate("requestedCleanerId", "username image")
      .populate("propertyId", "name location checkOutTime")
      .sort({ scheduledDate: 1, scheduledStartTime: 1 })
      .limit(400)
      .lean();

    const pendingLinks = await HostCleanerLink.countDocuments({
      hostId,
      status: "pending",
    });

    const serialized = jobs.map((job) => serializeCleaningJob(job));
    const open = serialized.filter((job) => job.status !== "cancelled");

    return Response.json({
      today: localTodayYmd(),
      pendingCleanerRequests: pendingLinks,
      groups: {
        today: open.filter(
          (job) =>
            job.scheduledDate === today &&
            !["completed", "cancelled"].includes(job.status),
        ),
        upcoming: open.filter(
          (job) =>
            job.scheduledDate > today &&
            !["completed", "cancelled"].includes(job.status),
        ),
        unassigned: open.filter(
          (job) => !job.cleanerId?._id && ["pending", "declined"].includes(job.status),
        ),
        requested: open.filter((job) => job.status === "requested"),
        inProgress: open.filter((job) =>
          ["en_route", "in_progress"].includes(job.status),
        ),
        completed: open
          .filter((job) => job.status === "completed")
          .slice(-20)
          .reverse(),
        issues: open.filter(
          (job) =>
            job.status === "issue_reported" || (job.issueReports || []).length > 0,
        ),
      },
    });
  } catch (error) {
    console.error("GET /api/host/cleaning/overview", error);
    return Response.json({ error: "Failed to load cleaning overview" }, { status: 500 });
  }
}
