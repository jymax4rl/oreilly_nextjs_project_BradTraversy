import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import { loadJobForHost } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { notifyCleaning } from "@/utils/cleaners/notify";
import { CLEANING_TYPES } from "@/utils/cleaners/constants";

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }
    const job = await loadJobForHost(id, session.user.id);
    if (!job) return Response.json({ error: "Cleaning not found" }, { status: 404 });
    return Response.json({ job: serializeCleaningJob(job) });
  } catch (error) {
    console.error("GET /api/host/cleaning/jobs/[id]", error);
    return Response.json({ error: "Failed to load cleaning" }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const job = await CleaningJob.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!job) return Response.json({ error: "Cleaning not found" }, { status: 404 });

    const body = await request.json();
    const prevDate = job.scheduledDate;
    const prevStart = job.scheduledStartTime;

    if (body.scheduledDate) job.scheduledDate = body.scheduledDate;
    if (body.scheduledStartTime) job.scheduledStartTime = body.scheduledStartTime;
    if (body.scheduledEndTime) job.scheduledEndTime = body.scheduledEndTime;
    if (body.estimatedDuration) job.estimatedDuration = Number(body.estimatedDuration);
    if (body.hostNotes != null) job.hostNotes = String(body.hostNotes).slice(0, 4000);
    if (body.cleaningType && CLEANING_TYPES.includes(body.cleaningType)) {
      job.cleaningType = body.cleaningType;
    }
    if (body.status === "cancelled" && job.status !== "completed") {
      job.status = "cancelled";
    }

    await job.save();

    const rescheduled =
      job.scheduledDate !== prevDate || job.scheduledStartTime !== prevStart;
    const notifyUser = job.cleanerId || job.requestedCleanerId;
    if (notifyUser && (rescheduled || job.status === "cancelled")) {
      await notifyCleaning({
        userId: notifyUser,
        jobId: job._id,
        kind: job.status === "cancelled" ? "cleaning_cancelled" : "cleaning_rescheduled",
        title: job.status === "cancelled" ? "Cleaning cancelled" : "Cleaning rescheduled",
        body: `${job.propertyName} · ${job.scheduledDate}`,
      });
    }

    const fresh = await loadJobForHost(job._id, session.user.id);
    return Response.json({ job: serializeCleaningJob(fresh) });
  } catch (error) {
    console.error("PATCH /api/host/cleaning/jobs/[id]", error);
    return Response.json({ error: "Failed to update cleaning" }, { status: 500 });
  }
}
