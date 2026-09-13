import mongoose from "mongoose";
import User from "@/models/User";
import MarketingSend from "@/models/MarketingSend";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { broadcastAudienceQuery } from "@/utils/ops/broadcastAudience";
import { getMarketingTemplate } from "@/utils/marketing/templates";
import {
  BATCH_MAX,
  EMAIL_RE,
  HOURLY_CAP,
  deliverTemplateToRecipient,
  hourlySentCount,
  recipientBlockReason,
  serializeRecipient,
  templateAlreadySent,
} from "@/utils/ops/sendTemplateEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_SELECT =
  "username email role hostStatus banned isTrainingGuest preferences.language hostAddress.countryCode hostAddress.country";

function localeCounts(users) {
  let fr = 0;
  let en = 0;
  for (const user of users) {
    if (user.locale === "fr") fr += 1;
    else en += 1;
  }
  return { fr, en };
}

function opsActor(session) {
  return {
    id: String(session.user.id || ""),
    email: session.user.email || null,
  };
}

async function loadEligible({ audience, templateId, force, excludeEmail }) {
  const query = broadcastAudienceQuery(audience);
  if (!query) return { error: "Choose who should receive this letter." };

  const users = await User.find(query)
    .select(USER_SELECT)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const withEmail = users
    .map(serializeRecipient)
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

async function loadOneUser(userId, excludeEmail) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { error: "Choose a person from the list.", status: 400 };
  }
  const user = await User.findById(userId).select(USER_SELECT).lean();
  if (!user) {
    return { error: "No account found for that person.", status: 404 };
  }
  const blocked = recipientBlockReason(user, { excludeEmail });
  if (blocked) {
    return { error: blocked, status: 400 };
  }
  return { user, recipient: serializeRecipient(user) };
}

/**
 * GET /api/ops/messages/broadcast?audience=&templateId=
 * GET /api/ops/messages/broadcast?userId=&templateId=
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const templateId = String(searchParams.get("templateId") || "become_a_host").trim();
    if (!getMarketingTemplate(templateId)) {
      return Response.json({ error: "Unknown template." }, { status: 400 });
    }

    const excludeEmail = String(gate.session.user.email || "")
      .trim()
      .toLowerCase();
    const used = await hourlySentCount(gate.session);
    const remaining = Math.max(0, HOURLY_CAP - used);
    const userId = String(searchParams.get("userId") || "").trim();

    if (userId) {
      const one = await loadOneUser(userId, excludeEmail);
      if (one.error) {
        return Response.json({ error: one.error }, { status: one.status || 400 });
      }
      const prior = await templateAlreadySent(one.recipient.email, templateId);
      return Response.json({
        recipient: one.recipient,
        alreadySent: Boolean(prior),
        alreadySentAt: prior?.createdAt || null,
        hourlyCap: HOURLY_CAP,
        hourlyRemaining: remaining,
      });
    }

    const audience = String(searchParams.get("audience") || "guests").trim();
    const force = searchParams.get("force") === "1";
    const preview = await loadEligible({
      audience,
      templateId,
      force,
      excludeEmail,
    });
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }

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
 * Body: { templateId, audience?, userId?, force?, attachPdf? }
 */
export async function POST(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const templateId = String(body?.templateId || "").trim();
    const audience = String(body?.audience || "").trim();
    const userId = String(body?.userId || "").trim();
    const force = Boolean(body?.force);
    const attachPdf = Boolean(body?.attachPdf);
    const template = getMarketingTemplate(templateId);
    if (!template) {
      return Response.json({ error: "Choose a template." }, { status: 400 });
    }

    const excludeEmail = String(gate.session.user.email || "")
      .trim()
      .toLowerCase();
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

    const sentBy = opsActor(gate.session);

    if (userId) {
      const one = await loadOneUser(userId, excludeEmail);
      if (one.error) {
        return Response.json({ error: one.error }, { status: one.status || 400 });
      }
      if (!force) {
        const prior = await templateAlreadySent(one.recipient.email, templateId);
        if (prior) {
          return Response.json(
            {
              error: "This template was already sent to that address.",
              code: "already_sent",
            },
            { status: 409 },
          );
        }
      }
      const result = await deliverTemplateToRecipient({
        recipient: one.recipient,
        templateId,
        attachPdf,
        sentBy,
      });
      if (!result.ok) {
        return Response.json(
          { error: result.error || "Send failed", result },
          { status: 502 },
        );
      }
      return Response.json({
        ok: true,
        sent: 1,
        failed: 0,
        sentFr: result.locale === "fr" ? 1 : 0,
        sentEn: result.locale === "en" ? 1 : 0,
        hourlyRemaining: Math.max(0, remaining - 1),
        result,
      });
    }

    const preview = await loadEligible({
      audience,
      templateId,
      force,
      excludeEmail,
    });
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }

    const batch = preview.eligible.slice(0, Math.min(BATCH_MAX, remaining));
    const results = [];
    for (const recipient of batch) {
      const result = await deliverTemplateToRecipient({
        recipient,
        templateId,
        attachPdf,
        sentBy,
      });
      results.push(result);
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
    return Response.json({ error: "Failed to send emails." }, { status: 500 });
  }
}
