import User from "@/models/User";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { getFoundingHostDashboardStats } from "@/utils/foundingHost/stats";
import { serializeFoundingHostOps } from "@/utils/foundingHost/serialize";
import { foundingHostDisplayStatus } from "@/utils/foundingHost/logic";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/founding-hosts
 * Dashboard stats + Founding Host directory.
 */
export async function GET(request) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().slice(0, 120);
  const status = String(searchParams.get("status") || "all");

  const stats = await getFoundingHostDashboardStats();
  const now = new Date();

  const query = { "foundingHost.number": { $ne: null } };
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    query.$or = [{ email: rx }, { username: rx }];
  }

  const users = await User.find(query)
    .select("email username image hostStatus foundingHost commissionOverride")
    .sort({ "foundingHost.number": 1 })
    .limit(500)
    .lean();

  const hosts = users
    .map((user) => serializeFoundingHostOps(user, now))
    .filter((row) => {
      if (status === "all") return true;
      return foundingHostDisplayStatus(
        {
          isFoundingHost: row.foundingHost.isFoundingHost,
          number: row.foundingHost.number,
          status: row.foundingHost.storedStatus,
          expiresAt: row.foundingHost.expiresAt,
        },
        now,
      ) === status;
    });

  return Response.json(
    { stats, hosts },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
