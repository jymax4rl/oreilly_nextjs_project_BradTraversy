import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import { canAccessOpsDocumentation } from "@/utils/documentation/access";

/**
 * Server-side page guard for /documentation/*.
 * Redirects unauthenticated users to ops login; forbidden users to /ops.
 */
export async function requireOpsDocumentationPage(callbackPath = "/documentation") {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const login = new URLSearchParams({ callbackUrl: callbackPath });
    redirect(`/ops/login?${login.toString()}`);
  }
  if (!canAccessOpsDocumentation(session.user)) {
    redirect("/ops");
  }
  return session;
}
