import connectToDatabase from "@/config/database";
import { getSessionFromRequest } from "@/utils/authSessionRoute";
import { getTrafficSnapshot } from "@/utils/metrics/getTrafficSnapshot";
import { isOpsStaff } from "@/utils/opsAuth";

export const dynamic = "force-dynamic";

/** Live visitor snapshot plus durable 7/30-day place history for the ops home. */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return Response.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const traffic = await getTrafficSnapshot();
    return Response.json(
      { traffic },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch ops traffic:", error);
    return Response.json({ error: "Failed to fetch traffic" }, { status: 500 });
  }
}
