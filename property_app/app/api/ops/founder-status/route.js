import connectToDatabase from "@/config/database";
import { getFounderBootstrapState } from "@/utils/opsFounder";

/**
 * Public read — only exposes whether one-time founder setup is open and which
 * email to prefill. Safe: no secrets; bootstrap gate is server-enforced on POST.
 */
export async function GET() {
  try {
    const connected = await connectToDatabase();
    if (!connected) {
      return Response.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }

    const state = await getFounderBootstrapState();
    return Response.json(state);
  } catch (error) {
    console.error("ops founder-status failed:", error);
    return Response.json(
      { error: "Failed to load founder status" },
      { status: 500 },
    );
  }
}
