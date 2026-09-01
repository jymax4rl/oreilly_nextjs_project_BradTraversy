import connectToDatabase from "@/config/database";
import {
  isLikelyBot,
  recordTrafficHit,
} from "@/utils/metrics/recordTraffic";

export const dynamic = "force-dynamic";

/**
 * Anonymous presence + page-view probe. No cookies required.
 * Body: { sid: uuid v4, kind: "view" | "heartbeat" }
 */
export async function POST(request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (isLikelyBot(ua)) {
      return new Response(null, { status: 204 });
    }

    const body = await request.json().catch(() => null);
    const sid = body?.sid;
    const kind = body?.kind === "heartbeat" ? "heartbeat" : "view";

    await connectToDatabase();
    const result = await recordTrafficHit({ sid, kind });
    if (!result.ok) {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Traffic hit failed:", error);
    return new Response(null, { status: 204 });
  }
}
