import { parseHorizonLeadInput } from "@/utils/horizon/sanitize";
import { sendHorizonLeadEmail } from "@/utils/horizon/notify";
import { clientIp, isAllowedCreatorOrigin } from "@/utils/creators/origin";
import { allowCreatorHit } from "@/utils/creators/rateLimit";

export const dynamic = "force-dynamic";

function horizonLeadRateOk(ip, email) {
  const hour = 60 * 60 * 1000;
  if (!allowCreatorHit(`hz-ip:${ip}`, { limit: 6, windowMs: hour })) {
    return false;
  }
  if (!allowCreatorHit(`hz-email:${email}`, { limit: 3, windowMs: hour })) {
    return false;
  }
  return true;
}

/**
 * POST /api/horizon/leads
 * Ownership interest for Horizon × Isisel — emails jimmeh@isisel.com.
 */
export async function POST(request) {
  try {
    if (!isAllowedCreatorOrigin(request)) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "invalid" }, { status: 400 });
    }

    const parsed = parseHorizonLeadInput(body);
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
    if (!horizonLeadRateOk(ip, parsed.email)) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const mailed = await sendHorizonLeadEmail(parsed);
    if (!mailed.ok) {
      console.error("Horizon lead email failed:", mailed.error);
      return Response.json({ error: "mail_failed" }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/horizon/leads:", error);
    return Response.json({ error: "server" }, { status: 500 });
  }
}
