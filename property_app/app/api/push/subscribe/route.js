import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import {
  getVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
} from "@/utils/push/webPush";

export const dynamic = "force-dynamic";

function requirePushSession(session) {
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };
  const host = session.user.hostStatus === "verified";
  const cleaner =
    session.user.cleanerStatus === "active" || session.user.role === "cleaner";
  if (!host && !cleaner) {
    return { error: "Host or cleaner access required", status: 403 };
  }
  return null;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const denied = requirePushSession(session);
  if (denied) {
    return Response.json({ error: denied.error }, { status: denied.status });
  }
  if (!getVapidPublicKey()) {
    return Response.json({ error: "Push is not configured" }, { status: 503 });
  }

  const ok = await connectToDatabase();
  if (!ok) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const result = await savePushSubscription(session.user.id, body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ success: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  const denied = requirePushSession(session);
  if (denied) {
    return Response.json({ error: denied.error }, { status: denied.status });
  }

  const ok = await connectToDatabase();
  if (!ok) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  await removePushSubscription(session.user.id, body?.endpoint);
  return Response.json({ success: true });
}
