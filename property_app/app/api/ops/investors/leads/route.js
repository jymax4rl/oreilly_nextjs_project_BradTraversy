import InvestorLead from "@/models/InvestorLead";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { INVESTOR_STAGE_IDS } from "@/utils/investors/constants";
import { serializeInvestorLead } from "@/utils/investors/sanitize";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const q = String(searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50) || 50));

    const query = {};
    if (stage && INVESTOR_STAGE_IDS.includes(stage)) query.stage = stage;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { organization: { $regex: q, $options: "i" } },
        { proposal: { $regex: q, $options: "i" } },
      ];
    }

    const [docs, total, grouped] = await Promise.all([
      InvestorLead.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InvestorLead.countDocuments(query),
      InvestorLead.aggregate([
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = Object.fromEntries(grouped.map((row) => [row._id, row.count]));

    return Response.json(
      {
        leads: docs.map(serializeInvestorLead),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        counts,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Ops investor leads GET failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
