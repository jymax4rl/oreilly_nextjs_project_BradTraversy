import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import { declineCleaningJob } from "@/utils/cleaners/jobs";

export async function POST(_request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const result = await declineCleaningJob(id, auth.user._id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST decline cleaning", error);
    return Response.json({ error: "Failed to decline cleaning" }, { status: 500 });
  }
}
