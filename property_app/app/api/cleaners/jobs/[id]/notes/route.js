import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";

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
    job.cleanerNotes = String(body?.cleanerNotes || "").slice(0, 4000);
    await job.save();
    return Response.json({ ok: true, cleanerNotes: job.cleanerNotes });
  } catch (error) {
    console.error("PATCH notes", error);
    return Response.json({ error: "Failed to save notes" }, { status: 500 });
  }
}
