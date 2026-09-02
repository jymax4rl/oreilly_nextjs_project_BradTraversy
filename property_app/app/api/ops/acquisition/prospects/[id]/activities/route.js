import { isValidObjectId } from "mongoose";
import HostProspect from "@/models/HostProspect";
import HostProspectActivity from "@/models/HostProspectActivity";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import {
  serializeActivity,
  combineFollowUp,
  sanitizeProspectInput,
  serializeProspect,
} from "@/utils/acquisition/prospects";
import {
  ACTIVITY_TYPE_IDS,
  STAGE_IDS,
  PRIORITY_IDS,
  stageLabel,
} from "@/utils/acquisition/constants";

export async function GET(request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    const docs = await HostProspectActivity.find({ prospect: id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return Response.json({ activities: docs.map(serializeActivity) });
  } catch (error) {
    console.error("acquisition activities GET:", error);
    return Response.json({ error: "Failed to load activity" }, { status: 500 });
  }
}

/**
 * POST — log an interaction, optionally move stage / set follow-up / priority.
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
    const type = ACTIVITY_TYPE_IDS.includes(body.type) ? body.type : "note";
    const description = String(body.description || "").trim().slice(0, 4000);
    if (!description) {
      return Response.json({ error: "Describe what happened" }, { status: 400 });
    }

    const outbound = ["call", "whatsapp", "email", "sms", "instagram_dm", "tiktok_dm"].includes(
      type,
    );
    if (outbound) {
      prospect.lastContactAt = new Date();
      if (prospect.contactStatus === "not_contacted") {
        prospect.contactStatus = "attempted";
      }
    }
    if (type === "owner_replied") {
      prospect.awaitingReply = false;
      prospect.contactStatus = "in_conversation";
    }
    if (type === "owner_interested" && ["new", "researching", "ready", "contacted", "follow_up"].includes(prospect.stage)) {
      prospect.stage = "interested";
    }
    if (body.awaitingReply !== undefined) {
      prospect.awaitingReply = Boolean(body.awaitingReply);
      if (prospect.awaitingReply) prospect.contactStatus = "awaiting_reply";
    }

    const patch = sanitizeProspectInput(
      {
        stage: body.stage,
        priority: body.priority,
      },
      { partial: true },
    );
    const prevStage = prospect.stage;
    if (patch.stage && STAGE_IDS.includes(patch.stage)) prospect.stage = patch.stage;
    if (patch.priority && PRIORITY_IDS.includes(patch.priority)) {
      prospect.priority = patch.priority;
    }

    if (body.followUpDate) {
      prospect.nextFollowUpAt = combineFollowUp(body.followUpDate, body.followUpTime);
      prospect.followUpStatus = "open";
      if (body.followUpReason) {
        prospect.followUpReason = String(body.followUpReason).trim().slice(0, 240);
      }
    }

    await prospect.save();

    const activity = await recordActivity({
      prospectId: prospect._id,
      type,
      description,
      session: gate.session,
    });

    if (prospect.stage !== prevStage) {
      await recordActivity({
        prospectId: prospect._id,
        type: "stage_change",
        description: `Stage moved from ${stageLabel(prevStage)} to ${stageLabel(prospect.stage)}.`,
        meta: { from: prevStage, to: prospect.stage },
        session: gate.session,
      });
    }

    return Response.json({
      prospect: serializeProspect(prospect.toObject()),
      activity: serializeActivity(activity.toObject()),
    });
  } catch (error) {
    console.error("acquisition activities POST:", error);
    return Response.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
