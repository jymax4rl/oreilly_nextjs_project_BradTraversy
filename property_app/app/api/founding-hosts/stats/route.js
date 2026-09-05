import connectToDatabase from "@/config/database";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";
import { serializeProgramPublicStats } from "@/utils/foundingHost/serialize";

export const dynamic = "force-dynamic";

/**
 * Public Founding 100 counter. No PII — claimed / remaining / limit only.
 */
export async function GET() {
  try {
    const ok = await connectToDatabase();
    if (!ok) {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }
    const settings = await getOrCreateProgramSettings();
    return Response.json(serializeProgramPublicStats(settings), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("GET /api/founding-hosts/stats:", error);
    return Response.json({ error: "Failed to load program stats" }, { status: 500 });
  }
}
