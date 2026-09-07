import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import { loadJobForCleaner } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const job = await loadJobForCleaner(id, auth.user._id);
    if (!job) {
      return Response.json({ error: "Cleaning not found" }, { status: 404 });
    }
    const host = await User.findById(job.hostId).select("username").lean();
    const serialized = serializeCleaningJob(job, { forCleaner: true });
    serialized.hostId = host
      ? { _id: String(host._id), name: host.username }
      : { _id: String(job.hostId) };
    return Response.json({ job: serialized });
  } catch (error) {
    console.error("GET /api/cleaners/jobs/[id]", error);
    return Response.json({ error: "Failed to load cleaning" }, { status: 500 });
  }
}
