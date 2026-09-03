import connectToDatabase from "@/config/database";
import CreatorFunnelEvent from "@/models/CreatorFunnelEvent";
import { CREATOR_FUNNEL_EVENTS } from "@/utils/creators/constants";
import { stripHeaderSafe, normalizePlatform } from "@/utils/creators/sanitize";
import {
  clientIp,
  isAllowedCreatorOrigin,
} from "@/utils/creators/origin";
import { creatorEventRateOk } from "@/utils/creators/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!isAllowedCreatorOrigin(request)) {
      return new Response(null, { status: 204 });
    }

    const ip = clientIp(request);
    if (!creatorEventRateOk(ip)) {
      return new Response(null, { status: 204 });
    }

    const body = await request.json().catch(() => null);
    const event = String(body?.event || "");
    if (!CREATOR_FUNNEL_EVENTS.includes(event)) {
      return new Response(null, { status: 204 });
    }

    const ok = await connectToDatabase();
    if (!ok) return new Response(null, { status: 204 });

    await CreatorFunnelEvent.create({
      event,
      platform: normalizePlatform(body?.platform),
      source: stripHeaderSafe(body?.source, 40),
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Creator funnel event failed:", error);
    return new Response(null, { status: 204 });
  }
}
