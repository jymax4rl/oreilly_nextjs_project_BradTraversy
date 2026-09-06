import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { resolveAnalyticsRange } from "@/utils/opsAnalytics/range";
import { buildOpsAnalytics } from "@/utils/opsAnalytics/buildReport";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const range = resolveAnalyticsRange({
      preset: searchParams.get("preset") || "last_30",
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      granularity: searchParams.get("granularity"),
    });
    const report = await buildOpsAnalytics(range);
    return Response.json(report, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("ops analytics GET:", error);
    return Response.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
