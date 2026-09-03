import { isValidObjectId } from "mongoose";
import HostProspect from "@/models/HostProspect";
import HostProspectActivity from "@/models/HostProspectActivity";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import {
  sanitizeProspectInput,
  serializeProspect,
  combineFollowUp,
} from "@/utils/acquisition/prospects";
import { stageLabel, priorityLabel } from "@/utils/acquisition/constants";

function idOr404(id) {
  if (!isValidObjectId(id)) return null;
  return id;
}

export async function GET(_request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = idOr404((await params).id);
    if (!id) return Response.json({ error: "Not found" }, { status: 404 });

    const doc = await HostProspect.findById(id).lean();
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ prospect: serializeProspect(doc) });
  } catch (error) {
    console.error("acquisition prospect GET:", error);
    return Response.json({ error: "Failed to load prospect" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = idOr404((await params).id);
    if (!id) return Response.json({ error: "Not found" }, { status: 404 });

    const existing = await HostProspect.findById(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const data = sanitizeProspectInput(body, { partial: true });

    if (body.followUpDate !== undefined) {
      data.nextFollowUpAt = combineFollowUp(body.followUpDate, body.followUpTime);
      if (data.nextFollowUpAt) data.followUpStatus = "open";
    }

    const prevStage = existing.stage;
    const prevPriority = existing.priority;
    Object.assign(existing, data);
    await existing.save();

    if (data.stage && data.stage !== prevStage) {
      await recordActivity({
        prospectId: existing._id,
        type: "stage_change",
        description: `Stage moved from ${stageLabel(prevStage)} to ${stageLabel(data.stage)}.`,
        meta: { from: prevStage, to: data.stage },
        session: gate.session,
      });
    }
    if (data.priority && data.priority !== prevPriority) {
      await recordActivity({
        prospectId: existing._id,
        type: "priority_change",
        description: `Priority changed from ${priorityLabel(prevPriority)} to ${priorityLabel(data.priority)}.`,
        meta: { from: prevPriority, to: data.priority },
        session: gate.session,
      });
    }
    if (data.nextFollowUpAt) {
      await recordActivity({
        prospectId: existing._id,
        type: "follow_up",
        description: `Follow-up scheduled for ${new Date(data.nextFollowUpAt).toLocaleString()}.`,
        session: gate.session,
      });
    }

    return Response.json({ prospect: serializeProspect(existing.toObject()) });
  } catch (error) {
    console.error("acquisition prospect PATCH:", error);
    return Response.json({ error: "Failed to update prospect" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = idOr404((await params).id);
    if (!id) return Response.json({ error: "Not found" }, { status: 404 });

    const existing = await HostProspect.findById(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    await HostProspectActivity.deleteMany({ prospect: existing._id });
    await existing.deleteOne();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("acquisition prospect DELETE:", error);
    return Response.json({ error: "Failed to delete prospect" }, { status: 500 });
  }
}
