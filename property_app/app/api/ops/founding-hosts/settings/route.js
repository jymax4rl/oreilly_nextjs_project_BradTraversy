import { requireOpsApi, opsActor } from "@/utils/ops/requireOpsApi";
import {
  getOrCreateProgramSettings,
  serializeProgramSettings,
} from "@/utils/foundingHost/settings";
import {
  normalizeProgramSettings,
  AUDIT_ACTIONS,
} from "@/utils/foundingHost/logic";
import { writeFoundingHostAudit } from "@/utils/foundingHost/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  const settings = await getOrCreateProgramSettings();
  return Response.json({ settings: serializeProgramSettings(settings) });
}

export async function PATCH(request) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = await getOrCreateProgramSettings();
  const parsed = normalizeProgramSettings({
    foundingHostLimit:
      body.foundingHostLimit ?? settings.foundingHostLimit,
    foundingHostCommissionRate:
      body.foundingHostCommissionRate ?? settings.foundingHostCommissionRate,
    foundingHostDurationYears:
      body.foundingHostDurationYears ?? settings.foundingHostDurationYears,
    programStatus: body.programStatus ?? settings.programStatus,
  });

  if (!parsed.ok) {
    return Response.json({ error: parsed.errors.join(" ") }, { status: 400 });
  }

  const previous = serializeProgramSettings(settings);
  settings.foundingHostLimit = parsed.value.foundingHostLimit;
  settings.foundingHostCommissionRate = parsed.value.foundingHostCommissionRate;
  settings.foundingHostDurationYears = parsed.value.foundingHostDurationYears;
  if (parsed.value.programStatus) {
    settings.programStatus = parsed.value.programStatus;
  }
  settings.updatedBy = gate.session.user.id || null;
  await settings.save();

  await writeFoundingHostAudit({
    hostId: null,
    action: AUDIT_ACTIONS.PROGRAM_SETTINGS_UPDATED,
    previousStatus: previous.programStatus,
    newStatus: settings.programStatus,
    actor: opsActor(gate.session),
    reason: typeof body.reason === "string" ? body.reason.trim() : null,
    meta: {
      previous,
      next: serializeProgramSettings(settings),
    },
  });

  return Response.json({ settings: serializeProgramSettings(settings) });
}
