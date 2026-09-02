import { isValidObjectId } from "mongoose";
import HostProspect from "@/models/HostProspect";
import HostProspectActivity from "@/models/HostProspectActivity";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import {
  sanitizeProspectInput,
  combineFollowUp,
} from "@/utils/acquisition/prospects";
import { STAGE_IDS, PRIORITY_IDS, stageLabel } from "@/utils/acquisition/constants";
import { actorPayload } from "@/utils/acquisition/prospects";

/**
 * POST /api/ops/acquisition/prospects/bulk
 * { ids, action, ...payload }
 */
export async function POST(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id) => isValidObjectId(id)).slice(0, 100)
      : [];
    if (!ids.length) {
      return Response.json({ error: "Select at least one prospect" }, { status: 400 });
    }

    const action = String(body.action || "");
    if (action === "delete") {
      await HostProspectActivity.deleteMany({ prospect: { $in: ids } });
      const result = await HostProspect.deleteMany({ _id: { $in: ids } });
      return Response.json({ ok: true, deleted: result.deletedCount || 0 });
    }

    const patch = {};
    if (action === "archive") patch.archived = true;
    if (action === "unarchive") patch.archived = false;
    if (action === "stage" && STAGE_IDS.includes(body.stage)) patch.stage = body.stage;
    if (action === "priority" && PRIORITY_IDS.includes(body.priority)) {
      patch.priority = body.priority;
    }
    if (action === "assign") {
      patch.assignedTo = actorPayload(body.assignedTo) || null;
    }
    if (action === "followup") {
      const when = combineFollowUp(body.followUpDate, body.followUpTime);
      if (!when) {
        return Response.json({ error: "Follow-up date required" }, { status: 400 });
      }
      patch.nextFollowUpAt = when;
      patch.followUpStatus = "open";
      if (body.followUpReason) {
        patch.followUpReason = String(body.followUpReason).trim().slice(0, 240);
      }
    }

    if (!Object.keys(patch).length) {
      return Response.json({ error: "Unknown bulk action" }, { status: 400 });
    }

    const extra = sanitizeProspectInput(patch, { partial: true });
    await HostProspect.updateMany({ _id: { $in: ids } }, { $set: extra });

    if (extra.stage) {
      await Promise.all(
        ids.map((id) =>
          recordActivity({
            prospectId: id,
            type: "stage_change",
            description: `Bulk stage change to ${stageLabel(extra.stage)}.`,
            meta: { to: extra.stage, bulk: true },
            session: gate.session,
          }),
        ),
      );
    }

    return Response.json({ ok: true, updated: ids.length });
  } catch (error) {
    console.error("acquisition bulk POST:", error);
    return Response.json({ error: "Bulk update failed" }, { status: 500 });
  }
}
