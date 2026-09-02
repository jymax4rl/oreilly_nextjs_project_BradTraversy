import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import connectToDatabase from "@/config/database";
import MarketingSend from "@/models/MarketingSend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/ops/marketing/sends?q=&templateId=
 * Search send history (email, name) and optionally filter by template.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized", { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") || "")
      .trim()
      .slice(0, 120);
    const templateId = String(searchParams.get("templateId") || "").trim();
    const exactEmail = String(searchParams.get("email") || "")
      .trim()
      .toLowerCase();

    const query = {};
    if (templateId) query.templateId = templateId;

    if (exactEmail && EMAIL_RE.test(exactEmail)) {
      query.recipientEmail = exactEmail;
    } else if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      query.$or = [{ recipientEmail: rx }, { recipientName: rx }];
    }

    const sends = await MarketingSend.find(query)
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const priorForEmail =
      exactEmail && EMAIL_RE.test(exactEmail)
        ? sends.filter((s) => s.recipientEmail === exactEmail)
        : [];

    return Response.json({
      sends: sends.map(serializeSend),
      priorCount: priorForEmail.length,
      alreadySentTemplateIds: [
        ...new Set(
          priorForEmail
            .filter((s) => s.status === "sent")
            .map((s) => s.templateId),
        ),
      ],
    });
  } catch (error) {
    console.error("ops marketing sends:", error);
    return Response.json({ error: "Failed to load sends" }, { status: 500 });
  }
}

function serializeSend(doc) {
  return {
    id: String(doc._id),
    recipientName: doc.recipientName,
    recipientEmail: doc.recipientEmail,
    templateId: doc.templateId,
    subject: doc.subject,
    status: doc.status,
    resendId: doc.resendId || null,
    error: doc.error || null,
    attachment: doc.attachment || null,
    sentBy: doc.sentBy || null,
    createdAt: doc.createdAt,
  };
}
