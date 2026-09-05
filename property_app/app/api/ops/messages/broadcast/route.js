import User from "@/models/User";
import MarketingSend from "@/models/MarketingSend";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { broadcastAudienceQuery } from "@/utils/ops/broadcastAudience";
import {
  getMarketingTemplate,
  resolveMarketingVars,
} from "@/utils/marketing/templates";
import { sendMarketingOutreachEmail } from "@/utils/marketing/sendMarketingEmail";
import { resolveUserEmailLocale } from "@/utils/user/resolveUserLocale";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOURLY_CAP = 25;
const BATCH_MAX = 25;

function firstNameFromUsername(name) {
  const text = String(name || "").trim();
  if (!text) return "";
  return text.split(/\s+/)[0].slice(0, 40);
}

function serializeUser(user) {
  return {
    id: String(user._id),
    name: firstNameFromUsername(user.username) || user.username || "",
    email: String(user.email || "").trim().toLowerCase(),
    locale: resolveUserEmailLocale(user),
  };
}

function localeCounts(users) {
  let fr = 0;
  let en = 0;
  for (const user of users) {
    if (user.locale === "fr") fr += 1;
    else en += 1;
  }
  return { fr, en };
}

async function hourlySentCount(session) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const senderMatch = [];
  const senderId = String(session.user.id || "");
  const senderEmail = session.user.email || "";
  if (senderId) senderMatch.push({ "sentBy.id": senderId });
  if (senderEmail) senderMatch.push({ "sentBy.email": senderEmail });
  if (!senderMatch.length) return 0;
  return MarketingSend.countDocuments({
    createdAt: { $gte: hourAgo },
    status: "sent",
    isTest: { $ne: true },
    $or: senderMatch,
  });
}

async function loadEligible({ audience, templateId, force, excludeEmail }) {
  const query = broadcastAudienceQuery(audience);
  if (!query) return { error: "Choose who should receive this letter." };

  const users = await User.find(query)
    .select("username email preferences.language hostAddress.countryCode hostAddress.country")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const withEmail = users
    .map(serializeUser)
    .filter((u) => EMAIL_RE.test(u.email) && u.email !== excludeEmail);

  const emails = withEmail.map((u) => u.email);
  const already = emails.length
    ? await MarketingSend.find({
        recipientEmail: { $in: emails },
        templateId,
        status: "sent",
        isTest: { $ne: true },
      })
        .select("recipientEmail")
        .lean()
    : [];
  const alreadySet = new Set(
    already.map((row) => String(row.recipientEmail || "").toLowerCase()),
  );

  const eligible = force
    ? withEmail
    : withEmail.filter((u) => !alreadySet.has(u.email));

  return {
    matching: users.length,
    withEmail: withEmail.length,
    alreadySent: alreadySet.size,
    eligible,
  };
}

/**
 * GET /api/ops/messages/broadcast?audience=&templateId=
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const audience = String(searchParams.get("audience") || "guests").trim();
    const templateId = String(searchParams.get("templateId") || "become_a_host").trim();
    if (!getMarketingTemplate(templateId)) {
      return Response.json({ error: "Unknown template." }, { status: 400 });
    }

    const force = searchParams.get("force") === "1";
    const preview = await loadEligible({
      audience,
      templateId,
      force,
      excludeEmail: String(gate.session.user.email || "")
        .trim()
        .toLowerCase(),
    });
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }

    const used = await hourlySentCount(gate.session);
    const remaining = Math.max(0, HOURLY_CAP - used);
    const languages = localeCounts(preview.eligible);
    const nextBatch = preview.eligible.slice(0, Math.min(BATCH_MAX, remaining));
    const nextLanguages = localeCounts(nextBatch);
    return Response.json({
      matching: preview.matching,
      withEmail: preview.withEmail,
      alreadySent: preview.alreadySent,
      eligible: preview.eligible.length,
      eligibleFr: languages.fr,
      eligibleEn: languages.en,
      nextCount: nextBatch.length,
      nextFr: nextLanguages.fr,
      nextEn: nextLanguages.en,
      hourlyCap: HOURLY_CAP,
      hourlyRemaining: remaining,
      batchMax: BATCH_MAX,
    });
  } catch (error) {
    console.error("GET /api/ops/messages/broadcast:", error);
    return Response.json({ error: "Failed to preview recipients." }, { status: 500 });
  }
}

/**
 * POST /api/ops/messages/broadcast
 * Body: { templateId, audience, force?, attachPdf? }
 */
export async function POST(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const templateId = String(body?.templateId || "").trim();
    const audience = String(body?.audience || "").trim();
    const force = Boolean(body?.force);
    const attachPdf = Boolean(body?.attachPdf);
    const template = getMarketingTemplate(templateId);
    if (!template) {
      return Response.json({ error: "Choose a template." }, { status: 400 });
    }

    const used = await hourlySentCount(gate.session);
    const remaining = Math.max(0, HOURLY_CAP - used);
    if (remaining <= 0) {
      return Response.json(
        {
          error: `Hourly send cap reached (${HOURLY_CAP}). Pause and continue later.`,
        },
        { status: 429 },
      );
    }

    const preview = await loadEligible({
      audience,
      templateId,
      force,
      excludeEmail: String(gate.session.user.email || "")
        .trim()
        .toLowerCase(),
    });
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }

    const batch = preview.eligible.slice(0, Math.min(BATCH_MAX, remaining));
    const sentBy = {
      id: String(gate.session.user.id || ""),
      email: gate.session.user.email || null,
    };

    const results = [];
    for (const recipient of batch) {
      const locale = recipient.locale === "fr" ? "fr" : "en";
      const vars = resolveMarketingVars({ firstName: recipient.name });
      const result = await sendMarketingOutreachEmail({
        templateId,
        name: recipient.name,
        email: recipient.email,
        attachPdf,
        locale,
        vars,
      });
      const log = await MarketingSend.create({
        recipientName: recipient.name || "—",
        recipientEmail: recipient.email,
        templateId,
        locale,
        isTest: false,
        subject: result.subject || template.label,
        status: result.ok ? "sent" : "failed",
        channel: "resend",
        resendId: result.resendId || null,
        error: result.ok ? null : result.error || "Send failed",
        attachment: result.attachment || null,
        sentBy,
      });
      results.push({
        email: recipient.email,
        name: recipient.name,
        locale,
        ok: Boolean(result.ok),
        error: result.ok ? null : result.error || "Send failed",
        id: String(log._id),
      });
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    const sentLanguages = localeCounts(results.filter((r) => r.ok));

    return Response.json({
      ok: failed === 0,
      sent,
      failed,
      sentFr: sentLanguages.fr,
      sentEn: sentLanguages.en,
      skippedAlready: force ? 0 : preview.alreadySent,
      remainingEligible: Math.max(0, preview.eligible.length - batch.length),
      hourlyRemaining: Math.max(0, remaining - sent),
      results,
    });
  } catch (error) {
    console.error("POST /api/ops/messages/broadcast:", error);
    return Response.json({ error: "Failed to send bulk emails." }, { status: 500 });
  }
}
