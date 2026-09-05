import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { resolveAnalyticsRange } from "@/utils/opsAnalytics/range";
import { buildOpsAnalytics } from "@/utils/opsAnalytics/buildReport";
import { CSV_KINDS, buildAnalyticsCsv } from "@/utils/opsAnalytics/csv";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") || "kpis";
    if (!CSV_KINDS.includes(kind)) {
      return Response.json({ error: "Unknown export kind" }, { status: 400 });
    }
    const range = resolveAnalyticsRange({
      preset: searchParams.get("preset") || "last_30",
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      granularity: searchParams.get("granularity"),
    });
    const report = await buildOpsAnalytics(range);
    const csv = buildAnalyticsCsv(kind, report);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="isisel-analytics-${kind}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ops analytics export GET:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
