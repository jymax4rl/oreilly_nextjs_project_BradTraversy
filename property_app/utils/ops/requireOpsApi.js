import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import connectToDatabase from "@/config/database";

/**
 * Ops API gate: staff session + Mongo.
 * @returns {{ session: import("next-auth").Session, error?: never } | { session?: never, error: Response }}
 */
export async function requireOpsApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOpsStaff(session.user.role)) {
    return { error: new Response("Unauthorized", { status: 403 }) };
  }
  const ok = await connectToDatabase();
  if (!ok) {
    return { error: new Response("Database unavailable", { status: 503 }) };
  }
  return { session };
}

export function opsActor(session) {
  return {
    id: session?.user?.id || null,
    email: session?.user?.email || null,
    name: session?.user?.name || session?.user?.email || "Ops",
  };
}
