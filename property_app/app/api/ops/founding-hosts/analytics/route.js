import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { getFoundingHostAnalytics } from "@/utils/foundingHost/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  const analytics = await getFoundingHostAnalytics();
  return Response.json(analytics, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
