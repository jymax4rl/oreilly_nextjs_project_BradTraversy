import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { resolveAnalyticsRange } from "@/utils/opsAnalytics/range";
import { buildOpsAnalytics } from "@/utils/opsAnalytics/buildReport";
import { buildAnalyticsPdf } from "@/utils/opsAnalytics/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const pdf = await buildAnalyticsPdf(report);
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="isisel-analytics-${range.preset}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ops analytics report GET:", error);
    return Response.json({ error: "Report failed" }, { status: 500 });
  }
}
