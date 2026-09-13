import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { canAccessOpsDocumentation } from "@/utils/documentation/access";

/**
 * Documentation API gate: Ops staff + Isisel staff email domain + Mongo.
 */
export async function requireOpsDocumentationApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessOpsDocumentation(session.user)) {
    return { error: new Response("Unauthorized", { status: 403 }) };
  }
  const ok = await connectToDatabase();
  if (!ok) {
    return { error: new Response("Database unavailable", { status: 503 }) };
  }
  return { session };
}

export function documentationActor(session) {
  return {
    id: session?.user?.id || null,
    email: session?.user?.email || null,
    name: session?.user?.name || session?.user?.email || "Ops",
  };
}
