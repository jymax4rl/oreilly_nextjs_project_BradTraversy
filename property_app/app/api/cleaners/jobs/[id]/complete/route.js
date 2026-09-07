import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import { completeCleaningJob, loadJobForCleaner } from "@/utils/cleaners/jobs";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";

export async function POST(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    let cleanerNotes;
    try {
      const body = await request.json();
      cleanerNotes = body?.cleanerNotes;
    } catch {
      cleanerNotes = undefined;
    }
    const result = await completeCleaningJob(id, auth.user._id, {
      cleanerNotes,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const job = await loadJobForCleaner(id, auth.user._id);
    return Response.json({ job: serializeCleaningJob(job, { forCleaner: true }) });
  } catch (error) {
    console.error("POST complete cleaning", error);
    return Response.json({ error: "Failed to complete cleaning" }, { status: 500 });
  }
}
