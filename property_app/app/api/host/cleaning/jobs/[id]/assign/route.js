import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import HostCleanerLink from "@/models/HostCleanerLink";
import { cleanerHasConflict, loadJobForHost } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { notifyCleaning } from "@/utils/cleaners/notify";

export async function POST(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const body = await request.json();
    const cleanerId = body?.cleanerId;
    if (!cleanerId) {
      return Response.json({ error: "Cleaner is required" }, { status: 400 });
    }

    const job = await CleaningJob.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!job) return Response.json({ error: "Cleaning not found" }, { status: 404 });

    const link = await HostCleanerLink.findOne({
      hostId: session.user.id,
      cleanerId,
      status: "active",
    }).lean();
    if (!link) {
      return Response.json(
        { error: "Cleaner is not on your trusted list" },
        { status: 400 },
      );
    }

    const conflict = await cleanerHasConflict({
      cleanerId,
      scheduledDate: job.scheduledDate,
      scheduledStartTime: job.scheduledStartTime,
      scheduledEndTime: job.scheduledEndTime,
      ignoreJobId: job._id,
    });
    if (conflict) {
      return Response.json(
        { error: "This cleaner already has a job in that window" },
        { status: 409 },
      );
    }

    const requestCleaner = body.requestCleaner !== false;
    if (requestCleaner) {
      job.requestedCleanerId = cleanerId;
      job.cleanerId = null;
      job.status = "requested";
    } else {
      job.cleanerId = cleanerId;
      job.requestedCleanerId = null;
      job.status = "scheduled";
    }
    await job.save();

    await notifyCleaning({
      userId: cleanerId,
      jobId: job._id,
      kind: requestCleaner ? "cleaning_request" : "cleaning_scheduled",
      title: requestCleaner ? "New cleaning request" : "New cleaning assigned",
      body: `${job.propertyName} · ${job.scheduledDate}`,
    });

    const fresh = await loadJobForHost(job._id, session.user.id);
    return Response.json({ job: serializeCleaningJob(fresh) });
  } catch (error) {
    console.error("POST /api/host/cleaning/jobs/[id]/assign", error);
    return Response.json({ error: "Failed to assign cleaner" }, { status: 500 });
  }
}
