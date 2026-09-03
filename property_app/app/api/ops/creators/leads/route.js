import CreatorLead from "@/models/CreatorLead";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { CREATOR_STAGE_IDS } from "@/utils/creators/constants";
import { serializeCreatorLead } from "@/utils/creators/sanitize";

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
    if (stage && CREATOR_STAGE_IDS.includes(stage)) query.stage = stage;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { profileUrl: { $regex: q, $options: "i" } },
      ];
    }

    const [docs, total, grouped] = await Promise.all([
      CreatorLead.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CreatorLead.countDocuments(query),
      CreatorLead.aggregate([
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = Object.fromEntries(grouped.map((row) => [row._id, row.count]));

    return Response.json(
      {
        leads: docs.map(serializeCreatorLead),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        counts,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Ops creator leads GET failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
