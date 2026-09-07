import InvestorLead from "@/models/InvestorLead";
import { requireOpsApi, opsActor } from "@/utils/ops/requireOpsApi";
import { INVESTOR_STAGE_IDS } from "@/utils/investors/constants";
import { serializeInvestorLead } from "@/utils/investors/sanitize";
import { stripText } from "@/utils/creators/sanitize";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const doc = await InvestorLead.findById(id).lean();
    if (!doc) return Response.json({ error: "not_found" }, { status: 404 });

    return Response.json(
      { lead: serializeInvestorLead(doc) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Ops investor lead GET failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const lead = await InvestorLead.findById(id);
    if (!lead) return Response.json({ error: "not_found" }, { status: 404 });

    if (typeof body?.notes === "string") {
      lead.notes = stripText(body.notes, 8000);
    }

    if (
      body?.stage &&
      INVESTOR_STAGE_IDS.includes(body.stage) &&
      body.stage !== lead.stage
    ) {
      lead.stage = body.stage;
      lead.stageHistory = [
        ...(lead.stageHistory || []),
        { stage: body.stage, at: new Date(), by: opsActor(gate.session) },
      ];
    }

    await lead.save();
    return Response.json({ lead: serializeInvestorLead(lead.toObject()) });
  } catch (error) {
    console.error("Ops investor lead PATCH failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
