import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import { listMarketingTemplatesPublic } from "@/utils/marketing/templates";
import { isMarketingEmailConfigured } from "@/utils/marketing/sendMarketingEmail";
import { getMarketingEmailFrom, getMarketingReplyTo } from "@/utils/email/fromAddress";

/**
 * GET /api/ops/marketing/templates
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOpsStaff(session.user.role)) {
    return new Response("Unauthorized", { status: 403 });
  }

  return Response.json({
    templates: listMarketingTemplatesPublic(),
    emailConfigured: isMarketingEmailConfigured(),
    fromAddress: getMarketingEmailFrom(),
    replyTo: getMarketingReplyTo(),
  });
}
