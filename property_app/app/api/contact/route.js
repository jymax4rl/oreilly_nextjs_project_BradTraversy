import { createHash } from "crypto";
import connectToDatabase from "@/config/database";
import ContactMessage from "@/models/ContactMessage";
import { parseContactInput } from "@/utils/contact/sanitize";
import { sendContactMessageEmail } from "@/utils/contact/notify";
import { clientIp, isAllowedCreatorOrigin } from "@/utils/creators/origin";
import { allowCreatorHit } from "@/utils/creators/rateLimit";

export const dynamic = "force-dynamic";

function ipHash(ip) {
  return createHash("sha256").update(String(ip || "unknown")).digest("hex");
}

function contactRateOk(ip, email) {
  const hour = 60 * 60 * 1000;
  if (!allowCreatorHit(`contact-ip:${ip}`, { limit: 6, windowMs: hour })) {
    return false;
  }
  if (!allowCreatorHit(`contact-email:${email}`, { limit: 3, windowMs: hour })) {
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

    const parsed = parseContactInput(body);
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
    if (!contactRateOk(ip, parsed.email)) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await ContactMessage.countDocuments({
      email: parsed.email,
      createdAt: { $gte: dayAgo },
    });
    if (recent >= 4) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const doc = await ContactMessage.create({
      name: parsed.name,
      email: parsed.email,
      topic: parsed.topic,
      message: parsed.message,
      source: parsed.source,
      ipHash: ipHash(ip),
    });

    const mailed = await sendContactMessageEmail(doc);
    if (mailed.ok) {
      doc.emailSentAt = new Date();
      await doc.save();
    } else {
      doc.emailError = String(mailed.error || "send_failed").slice(0, 400);
      await doc.save();
      console.error("Contact message email failed:", mailed.error);
    }

    return Response.json({ ok: true, name: parsed.name });
  } catch (error) {
    console.error("Contact POST failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
