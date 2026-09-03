import { createHash } from "crypto";
import connectToDatabase from "@/config/database";
import CreatorLead from "@/models/CreatorLead";
import { CREATOR_SOURCE } from "@/utils/creators/constants";
import { parseCreatorLeadInput } from "@/utils/creators/sanitize";
import { sendCreatorLeadEmail } from "@/utils/creators/notify";
import {
  clientIp,
  isAllowedCreatorOrigin,
} from "@/utils/creators/origin";
import { creatorLeadRateOk } from "@/utils/creators/rateLimit";

export const dynamic = "force-dynamic";

function ipHash(ip) {
  return createHash("sha256").update(String(ip || "unknown")).digest("hex");
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

    const parsed = parseCreatorLeadInput(body);
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
    if (!creatorLeadRateOk(ip, parsed.email)) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await CreatorLead.countDocuments({
      email: parsed.email,
      createdAt: { $gte: dayAgo },
    });
    if (recent >= 3) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const lead = await CreatorLead.create({
      name: parsed.name,
      email: parsed.email,
      platform: parsed.platform || undefined,
      profileUrl: parsed.profileUrl,
      message: parsed.message,
      source: CREATOR_SOURCE,
      stage: "new",
      stageHistory: [{ stage: "new", at: new Date() }],
      ipHash: ipHash(ip),
    });

    const mailed = await sendCreatorLeadEmail(lead);
    if (mailed.ok) {
      lead.emailSentAt = new Date();
      await lead.save();
    } else {
      lead.emailError = String(mailed.error || "send_failed").slice(0, 400);
      await lead.save();
      console.error("Creator lead email failed:", mailed.error);
    }

    return Response.json({ ok: true, name: parsed.name });
  } catch (error) {
    console.error("Creator lead POST failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
