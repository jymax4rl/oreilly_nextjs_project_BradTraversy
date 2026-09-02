import { isValidObjectId } from "mongoose";
import HostProspect from "@/models/HostProspect";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import {
  sanitizeProspectInput,
  serializeProspect,
  combineFollowUp,
} from "@/utils/acquisition/prospects";
import {
  sanitizeMemory,
  crmPatchFromMemory,
} from "@/utils/acquisition/copilot";
import { CALL_RESULTS, CALL_RESULT_IDS, stageLabel } from "@/utils/acquisition/constants";

/**
 * POST /api/ops/acquisition/prospects/[id]/copilot
 * Merge live conversation memory, optionally wrap the call.
 */
export async function POST(request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const prospect = await HostProspect.findById(id);
    if (!prospect) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const memory = sanitizeMemory({
      ...(prospect.copilotMemory || {}),
      ...(body.memory || {}),
    });
    prospect.copilotMemory = memory;

    const fromMemory = crmPatchFromMemory(memory);
    const extra = sanitizeProspectInput(
      {
        ...fromMemory,
        painPoint: fromMemory.painPoint,
        lookingForBookings: fromMemory.lookingForBookings,
      },
      { partial: true },
    );
    Object.assign(prospect, extra);

    if (!body.saveCall) {
      await prospect.save();
      return Response.json({ prospect: serializeProspect(prospect.toObject()), memory });
    }

    const result = CALL_RESULT_IDS.includes(body.result)
      ? body.result
      : "follow_up";
    const mapped = CALL_RESULTS.find((r) => r.id === result);
    if (mapped?.stage) prospect.stage = mapped.stage;
    prospect.callResult = result;
    prospect.lastContactAt = new Date();
    prospect.contactStatus =
      result === "no_answer" || result === "wrong_person" ? "attempted" : "reached";

    if (result === "asked_info") prospect.awaitingReply = true;
    if (result === "interested" || result === "converted") {
      prospect.awaitingReply = false;
    }

    if (body.followUpDate) {
      prospect.nextFollowUpAt = combineFollowUp(body.followUpDate, body.followUpTime);
      prospect.followUpStatus = "open";
      if (body.followUpReason) {
        prospect.followUpReason = String(body.followUpReason).trim().slice(0, 240);
      }
    }

    const nextAction = String(body.nextAction || "call").slice(0, 40);
    const notes = String(body.notes || "").trim().slice(0, 4000);
    if (notes) {
      const prior = prospect.notes ? `${prospect.notes}\n\n` : "";
      prospect.notes = `${prior}Call ${new Date().toISOString().slice(0, 10)}: ${notes}`.slice(
        0,
        8000,
      );
    }

    if (["whatsapp", "email", "phone", "call"].includes(nextAction)) {
      prospect.preferredContactMethod =
        nextAction === "call" ? "phone" : nextAction === "phone" ? "phone" : nextAction;
    }

    await prospect.save();

    const summary = [
      `Copilot call: ${mapped?.label || result}.`,
      memory.platforms ? `Bookings via ${memory.platforms}.` : "",
      memory.propertyBand ? `${memory.propertyBand} properties.` : "",
      memory.pain ? `Pain: ${memory.pain}.` : "",
      memory.interest ? `Interest: ${memory.interest}.` : "",
      nextAction ? `Next: ${nextAction}.` : "",
      notes,
    ]
      .filter(Boolean)
      .join(" ");

    await recordActivity({
      prospectId: prospect._id,
      type: result === "not_interested" ? "owner_declined" : "call",
      description: summary,
      meta: { memory, result, nextAction, copilot: true },
      session: gate.session,
    });

    if (mapped?.stage) {
      await recordActivity({
        prospectId: prospect._id,
        type: "stage_change",
        description: `Call result moved stage to ${stageLabel(mapped.stage)}.`,
        meta: { to: mapped.stage, result },
        session: gate.session,
      });
    }

    return Response.json({
      ok: true,
      prospect: serializeProspect(prospect.toObject()),
      memory,
    });
  } catch (error) {
    console.error("acquisition copilot POST:", error);
    return Response.json({ error: "Failed to save copilot" }, { status: 500 });
  }
}
