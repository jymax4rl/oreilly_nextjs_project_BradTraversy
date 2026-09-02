import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import connectToDatabase from "@/config/database";
import MarketingSend from "@/models/MarketingSend";
import { getMarketingTemplate } from "@/utils/marketing/templates";
import { sendMarketingOutreachEmail } from "@/utils/marketing/sendMarketingEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOURLY_CAP = 25;

/**
 * POST /api/ops/marketing/send
 * Body: { name, email, templateId, attachPdf?, force? }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized", { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim().slice(0, 120);
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const templateId = String(body?.templateId || "").trim();
    const attachPdf = body?.attachPdf !== false;
    const force = Boolean(body?.force);

    if (name.length < 2) {
      return Response.json({ error: "Enter the recipient's name." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!getMarketingTemplate(templateId)) {
      return Response.json({ error: "Choose a marketing template." }, { status: 400 });
    }

    await connectToDatabase();

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const senderId = String(session.user.id || "");
    const senderEmail = session.user.email || "";
    const senderMatch = [];
    if (senderId) senderMatch.push({ "sentBy.id": senderId });
    if (senderEmail) senderMatch.push({ "sentBy.email": senderEmail });
    const recentCount = senderMatch.length
      ? await MarketingSend.countDocuments({
          createdAt: { $gte: hourAgo },
          status: "sent",
          $or: senderMatch,
        })
      : 0;
    if (recentCount >= HOURLY_CAP) {
      return Response.json(
        {
          error: `Hourly send cap reached (${HOURLY_CAP}). Pause and continue later.`,
        },
        { status: 429 },
      );
    }

    const duplicate = await MarketingSend.findOne({
      recipientEmail: email,
      templateId,
      status: "sent",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (duplicate && !force) {
      return Response.json(
        {
          error: "This template was already sent to that address.",
          code: "already_sent",
          prior: {
            id: String(duplicate._id),
            createdAt: duplicate.createdAt,
            subject: duplicate.subject,
          },
        },
        { status: 409 },
      );
    }

    const result = await sendMarketingOutreachEmail({
      templateId,
      name,
      email,
      attachPdf,
    });

    const sentBy = {
      id: String(session.user.id || ""),
      email: session.user.email || null,
    };

    const log = await MarketingSend.create({
      recipientName: name,
      recipientEmail: email,
      templateId,
      subject: result.subject || getMarketingTemplate(templateId).subject,
      status: result.ok ? "sent" : "failed",
      resendId: result.resendId || null,
      error: result.ok ? null : result.error || "Send failed",
      attachment: result.attachment || null,
      sentBy,
    });

    if (!result.ok) {
      return Response.json(
        {
          error: result.error || "Send failed",
          send: serialize(log),
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      send: serialize(log),
      attachmentMissing: Boolean(result.attachmentMissing),
    });
  } catch (error) {
    console.error("ops marketing send:", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}

function serialize(doc) {
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(row._id),
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    templateId: row.templateId,
    subject: row.subject,
    status: row.status,
    resendId: row.resendId || null,
    error: row.error || null,
    attachment: row.attachment || null,
    sentBy: row.sentBy || null,
    createdAt: row.createdAt,
  };
}
