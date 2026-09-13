import { createHash } from "crypto";
import connectToDatabase from "@/config/database";
import InvestorLead from "@/models/InvestorLead";
import { INVESTOR_SOURCE } from "@/utils/investors/constants";
import { parseInvestorLeadInput } from "@/utils/investors/sanitize";
import { sendInvestorLeadEmail } from "@/utils/investors/notify";
import { clientIp, isAllowedCreatorOrigin } from "@/utils/creators/origin";
import { allowCreatorHit } from "@/utils/creators/rateLimit";

export const dynamic = "force-dynamic";

function ipHash(ip) {
  return createHash("sha256").update(String(ip || "unknown")).digest("hex");
}

function investorLeadRateOk(ip, email) {
  const hour = 60 * 60 * 1000;
  if (!allowCreatorHit(`inv-ip:${ip}`, { limit: 6, windowMs: hour })) {
    return false;
  }
  if (!allowCreatorHit(`inv-email:${email}`, { limit: 3, windowMs: hour })) {
    return false;
  }
  return true;
}

export async function POST(request) {
  try {
    if (!isAllowedCreatorOrigin(request)) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "invalid" }, { status: 400 });
    }

    const parsed = parseInvestorLeadInput(body);
    if (parsed.honeypot) {
      return Response.json({ ok: true, skipped: true });
    }
    if (parsed.errors.length) {
      return Response.json(
        { error: "validation", fields: parsed.errors },
        { status: 400 },
      );
    }

    const ip = clientIp(request);
    if (!investorLeadRateOk(ip, parsed.email)) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await InvestorLead.countDocuments({
      email: parsed.email,
      createdAt: { $gte: dayAgo },
    });
    if (recent >= 3) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const lead = await InvestorLead.create({
      name: parsed.name,
      email: parsed.email,
      organization: parsed.organization || undefined,
      role: parsed.role || undefined,
      firmUrl: parsed.firmUrl,
      proposal: parsed.proposal,
      source: INVESTOR_SOURCE,
      stage: "new",
      stageHistory: [{ stage: "new", at: new Date() }],
      ipHash: ipHash(ip),
    });

    const mailed = await sendInvestorLeadEmail(lead);
    if (mailed.ok) {
      lead.emailSentAt = new Date();
      await lead.save();
    } else {
      lead.emailError = String(mailed.error || "send_failed").slice(0, 400);
      await lead.save();
      console.error("Investor lead email failed:", mailed.error);
    }

    return Response.json({ ok: true, name: parsed.name });
  } catch (error) {
    console.error("Investor lead POST failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
