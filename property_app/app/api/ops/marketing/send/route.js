import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import connectToDatabase from "@/config/database";
import MarketingSend from "@/models/MarketingSend";
import { getMarketingTemplate, normalizeMarketingLocale, resolveMarketingVars, composeMarketingLetter } from "@/utils/marketing/templates";
import { sendMarketingOutreachEmail } from "@/utils/marketing/sendMarketingEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOURLY_CAP = 25;
const MAX_BODY = 20000;

function fallbackSubject(locale) {
  return locale === "fr"
    ? "Opportunité de partenariat"
    : "Partnership opportunity";
}

/**
 * POST /api/ops/marketing/send
 * Body: { name, email, templateId, via?, attachPdf?, force?, locale?, subject?, body?, test? }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized", { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const viaGmail = String(body?.via || "").toLowerCase() === "gmail";
    const isTest = viaGmail ? false : Boolean(body?.test);
    const locale = normalizeMarketingLocale(body?.locale);
    const name = String(body?.name || "").trim().slice(0, 120);
    const email = String(
      isTest ? session.user.email || body?.email || "" : body?.email || "",
    )
      .trim()
      .toLowerCase();
    const templateId = String(body?.templateId || "").trim();
    const attachPdf = body?.attachPdf !== false;
    const force = Boolean(body?.force);
    const subject = String(body?.subject || "").trim().slice(0, 200);
    const letter = String(body?.body || "").trim().slice(0, MAX_BODY);

    if (!isTest && name.length < 2) {
      return Response.json({ error: "Enter the recipient's name." }, { status: 400 });
    }
    if (isTest && !EMAIL_RE.test(email)) {
      return Response.json(
        { error: "Sign in with an email address to send a test to yourself." },
        { status: 400 },
      );
    }
    if (!isTest && !EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!getMarketingTemplate(templateId)) {
      return Response.json({ error: "Choose a marketing template." }, { status: 400 });
    }
    if (subject && subject.length < 3) {
      return Response.json({ error: "Subject is too short." }, { status: 400 });
    }
    if (letter && letter.length < 20) {
      return Response.json({ error: "The letter is too short." }, { status: 400 });
    }

    await connectToDatabase();

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const senderId = String(session.user.id || "");
    const senderEmail = session.user.email || "";
    const senderMatch = [];
    if (senderId) senderMatch.push({ "sentBy.id": senderId });
    if (senderEmail) senderMatch.push({ "sentBy.email": senderEmail });
    if (!isTest && senderMatch.length) {
      const recentCount = await MarketingSend.countDocuments({
        createdAt: { $gte: hourAgo },
        status: "sent",
        isTest: { $ne: true },
        $or: senderMatch,
      });
      if (recentCount >= HOURLY_CAP) {
        return Response.json(
          {
            error: `Hourly send cap reached (${HOURLY_CAP}). Pause and continue later.`,
          },
          { status: 429 },
        );
      }
    }

    if (!isTest) {
      const duplicate = await MarketingSend.findOne({
        recipientEmail: email,
        templateId,
        status: "sent",
        isTest: { $ne: true },
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
    }

    const displayName = name.length >= 1 ? name : "—";
    const vars = resolveMarketingVars({
      firstName: name,
      propertyName: String(body?.propertyName || "").trim().slice(0, 160),
      businessName: String(body?.businessName || "").trim().slice(0, 160),
      city: String(body?.city || "").trim().slice(0, 80),
      country: String(body?.country || "").trim().slice(0, 80),
      location: String(body?.location || "").trim().slice(0, 120),
      originalSubject: String(body?.originalSubject || "").trim().slice(0, 200),
      socialUrl: String(body?.socialUrl || "").trim().slice(0, 300),
    });

    const sentBy = {
      id: String(session.user.id || ""),
      email: session.user.email || null,
    };

    if (viaGmail) {
      const generated = composeMarketingLetter(getMarketingTemplate(templateId), {
        ...vars,
        locale,
      });
      const finalSubject =
        subject || generated.subject || fallbackSubject(locale);
      const log = await MarketingSend.create({
        recipientName: displayName,
        recipientEmail: email,
        templateId,
        locale,
        isTest: false,
        subject: finalSubject,
        status: "sent",
        channel: "gmail",
        resendId: null,
        error: null,
        attachment: null,
        socialUrl: vars.socialUrl || null,
        sentBy,
      });
      return Response.json({
        ok: true,
        via: "gmail",
        send: serialize(log),
      });
    }

    const result = await sendMarketingOutreachEmail({
      templateId,
      name: name.length >= 2 ? name : "",
      email,
      attachPdf,
      locale,
      subject: subject || undefined,
      body: letter || undefined,
      vars,
    });

    const log = await MarketingSend.create({
      recipientName: displayName,
      recipientEmail: email,
      templateId,
      locale,
      isTest,
      subject: result.subject || subject || fallbackSubject(locale),
      status: result.ok ? "sent" : "failed",
      channel: "resend",
      resendId: result.resendId || null,
      error: result.ok ? null : result.error || "Send failed",
      attachment: result.attachment || null,
      socialUrl: vars.socialUrl || null,
      sentBy,
    });

    if (!result.ok) {
      return Response.json(
        {
          error: result.error || "Send failed",
          from: result.from || null,
          send: serialize(log),
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      send: serialize(log),
      from: result.from || null,
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
    locale: row.locale || "en",
    isTest: Boolean(row.isTest),
    subject: row.subject,
    status: row.status,
    channel: row.channel || "resend",
    resendId: row.resendId || null,
    error: row.error || null,
    attachment: row.attachment || null,
    socialUrl: row.socialUrl || null,
    sentBy: row.sentBy || null,
    createdAt: row.createdAt,
  };
}
