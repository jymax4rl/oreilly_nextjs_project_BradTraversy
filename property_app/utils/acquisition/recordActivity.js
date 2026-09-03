import HostProspectActivity from "@/models/HostProspectActivity";
import { ACTIVITY_TYPE_IDS } from "@/utils/acquisition/constants";
import { opsActor } from "@/utils/ops/requireOpsApi";

export async function recordActivity({
  prospectId,
  type,
  description,
  meta,
  session,
}) {
  const safeType = ACTIVITY_TYPE_IDS.includes(type) ? type : "note";
  const text = String(description || "").trim().slice(0, 4000);
  if (!text) return null;
  const doc = await HostProspectActivity.create({
    prospect: prospectId,
    type: safeType,
    description: text,
    meta: meta || undefined,
    actor: opsActor(session),
  });
  return doc;
}
