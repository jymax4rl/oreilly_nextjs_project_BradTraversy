import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";
import { ISSUE_TYPES } from "@/utils/cleaners/constants";
import { notifyCleaning } from "@/utils/cleaners/notify";

export async function POST(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const job = await CleaningJob.findOne({
      _id: id,
      cleanerId: auth.user._id,
    });
    if (!job) {
      return Response.json({ error: "Cleaning not found" }, { status: 404 });
    }

    const body = await request.json();
    const type = ISSUE_TYPES.includes(body?.type) ? body.type : "other";
    const photoIds = new Set((body.photoIds || []).map(String));
    const audioIds = new Set((body.audioIds || []).map(String));
    const photos = (job.photos || []).filter((photo) => photoIds.has(String(photo._id)));
    const audio = (job.audioReports || []).filter((item) =>
      audioIds.has(String(item._id)),
    );

    job.issueReports.push({
      type,
      note: String(body.note || "").slice(0, 2000),
      photos,
      audio,
      status: "reported",
      createdBy: auth.user._id,
    });
    if (job.status === "in_progress" || job.status === "completed") {
      job.status = "issue_reported";
    }
    await job.save();

    await notifyCleaning({
      userId: job.hostId,
      jobId: job._id,
      kind: "issue_reported",
      title: "Issue reported",
      body: `${type.replaceAll("_", " ")} · ${job.propertyName}`,
    });

    const issue = job.issueReports[job.issueReports.length - 1];
    return Response.json({
      issue: {
        _id: String(issue._id),
        type: issue.type,
        note: issue.note,
        status: issue.status,
      },
    });
  } catch (error) {
    console.error("POST cleaning issue", error);
    return Response.json({ error: "Failed to report issue" }, { status: 500 });
  }
}
