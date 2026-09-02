import HostProspect from "@/models/HostProspect";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { opsActor } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import {
  prospectMatchQuery,
  sanitizeProspectInput,
  serializeProspect,
  combineFollowUp,
} from "@/utils/acquisition/prospects";
import { stageLabel } from "@/utils/acquisition/constants";

const SORT_FIELDS = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  businessName: "businessName",
  contactName: "contactName",
  city: "city",
  stage: "stage",
  priority: "priority",
  lastContactAt: "lastContactAt",
  nextFollowUpAt: "nextFollowUpAt",
  propertyCount: "propertyCount",
  source: "source",
};

/**
 * GET /api/ops/acquisition/prospects
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50) || 50));
    const sortKey = SORT_FIELDS[searchParams.get("sort")] || "createdAt";
    const dir = searchParams.get("dir") === "asc" ? 1 : -1;
    const board = searchParams.get("view") === "board";

    const query = prospectMatchQuery({
      q: searchParams.get("q"),
      stage: searchParams.get("stage"),
      source: searchParams.get("source"),
      priority: searchParams.get("priority"),
      city: searchParams.get("city"),
      assignedTo: searchParams.get("assignedTo"),
      kpi: searchParams.get("kpi"),
      followup: searchParams.get("followup"),
      lastContacted: searchParams.get("lastContacted"),
      propertyCountMin: searchParams.get("propertyCountMin"),
      propertyCountMax: searchParams.get("propertyCountMax"),
      archived: searchParams.get("archived"),
    });

    if (board) {
      const docs = await HostProspect.find(query)
        .sort({ [sortKey]: dir, createdAt: -1 })
        .limit(400)
        .lean();
      return Response.json(
        {
          prospects: docs.map(serializeProspect),
          total: docs.length,
          page: 1,
          pages: 1,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [docs, total] = await Promise.all([
      HostProspect.find(query)
        .sort({ [sortKey]: dir, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      HostProspect.countDocuments(query),
    ]);

    return Response.json(
      {
        prospects: docs.map(serializeProspect),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("acquisition prospects GET:", error);
    return Response.json({ error: "Failed to load prospects" }, { status: 500 });
  }
}

/**
 * POST /api/ops/acquisition/prospects
 */
export async function POST(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const data = sanitizeProspectInput(body, { partial: false });
    if (!data.businessName) {
      return Response.json(
        { error: "Business / property name is required" },
        { status: 400 },
      );
    }

    if (body.followUpDate) {
      data.nextFollowUpAt = combineFollowUp(body.followUpDate, body.followUpTime);
      if (data.nextFollowUpAt) data.followUpStatus = "open";
    }

    data.createdBy = opsActor(gate.session);
    if (body.assignSelf && !data.assignedTo) {
      data.assignedTo = data.createdBy;
    }

    const doc = await HostProspect.create(data);
    await recordActivity({
      prospectId: doc._id,
      type: "note",
      description: `Prospect added in ${stageLabel(doc.stage)}.`,
      session: gate.session,
    });

    return Response.json({ prospect: serializeProspect(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error("acquisition prospects POST:", error);
    return Response.json({ error: "Failed to create prospect" }, { status: 500 });
  }
}
