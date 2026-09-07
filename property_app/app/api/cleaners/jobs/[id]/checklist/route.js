import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";

export async function PATCH(request, context) {
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
    if (body.key) {
      const item = job.checklist.find((entry) => entry.key === body.key);
      if (item) item.done = Boolean(body.done);
    } else if (Array.isArray(body.checklist)) {
      const doneByKey = new Map(body.checklist.map((item) => [item.key, item.done]));
      job.checklist.forEach((item) => {
        if (doneByKey.has(item.key)) item.done = Boolean(doneByKey.get(item.key));
      });
    }
    await job.save();
    return Response.json({
      job: serializeCleaningJob(job.toObject(), { forCleaner: true }),
    });
  } catch (error) {
    console.error("PATCH checklist", error);
    return Response.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
