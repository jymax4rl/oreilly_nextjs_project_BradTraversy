import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import mongoose from "mongoose";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { serializeFoundingHostOps } from "@/utils/foundingHost/serialize";
import { serializeAuditLog } from "@/utils/foundingHost/audit";
import {
  grantFoundingHostManually,
  revokeFoundingHost,
  extendFoundingHost,
  grantCommissionOverride,
  revokeCommissionOverride,
  extendCommissionOverride,
} from "@/utils/foundingHost/opsActions";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  const { userId } = await params;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return Response.json({ error: "Invalid host id" }, { status: 400 });
  }

  const user = await User.findById(userId)
    .select("email username image hostStatus foundingHost commissionOverride")
    .lean();
  if (!user) {
    return Response.json({ error: "Host not found" }, { status: 404 });
  }

  const history = await AuditLog.find({ host: user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return Response.json({
    host: serializeFoundingHostOps(user),
    history: history.map(serializeAuditLog),
  });
}

export async function POST(request, { params }) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  const { userId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = String(body?.action || "").trim();
  const session = gate.session;
  let result;

  switch (action) {
    case "grant":
      result = await grantFoundingHostManually({
        userId,
        session,
        reason: body.reason,
        notes: body.notes,
        overrideLimit: body.overrideLimit === true,
      });
      break;
    case "revoke":
      result = await revokeFoundingHost({
        userId,
        session,
        reason: body.reason,
        notes: body.notes,
      });
      break;
    case "extend":
      result = await extendFoundingHost({
        userId,
        session,
        expiresAt: body.expiresAt,
        addYears: body.addYears,
        reason: body.reason,
        notes: body.notes,
      });
      break;
    case "commission-free":
      result = await grantCommissionOverride({
        userId,
        session,
        rate: body.rate,
        startsAt: body.startsAt,
        expiresAt: body.expiresAt,
        reason: body.reason,
        notes: body.notes,
      });
      break;
    case "commission-free-revoke":
      result = await revokeCommissionOverride({
        userId,
        session,
        reason: body.reason,
        notes: body.notes,
      });
      break;
    case "commission-free-extend":
      result = await extendCommissionOverride({
        userId,
        session,
        expiresAt: body.expiresAt,
        reason: body.reason,
        notes: body.notes,
      });
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  if (result.error) {
    return Response.json(
      { error: result.error, code: result.code || null },
      { status: result.status || 400 },
    );
  }

  const user = await User.findById(userId)
    .select("email username image hostStatus foundingHost commissionOverride")
    .lean();

  return Response.json({
    ok: true,
    host: user ? serializeFoundingHostOps(user) : null,
  });
}
