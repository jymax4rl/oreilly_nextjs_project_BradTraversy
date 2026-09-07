import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import { startCleaningJob, loadJobForCleaner } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";

export async function POST(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const result = await startCleaningJob(id, auth.user._id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const job = await loadJobForCleaner(id, auth.user._id);
    return Response.json({ job: serializeCleaningJob(job, { forCleaner: true }) });
  } catch (error) {
    console.error("POST start cleaning", error);
    return Response.json({ error: "Failed to start cleaning" }, { status: 500 });
  }
}
