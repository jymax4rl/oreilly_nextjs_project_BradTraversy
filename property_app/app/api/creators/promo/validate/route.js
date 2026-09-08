import connectToDatabase from "@/config/database";
import {
  normalizePromoCode,
  resolveOptionalPromoAttribution,
} from "@/utils/creators/promoAttribution";

/**
 * POST /api/creators/promo/validate
 * Guest-facing soft check before reserve (does not consume the code).
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId;
    const promoCode = normalizePromoCode(body.promoCode || body.code);

    if (!propertyId) {
      return Response.json({ error: "propertyId required" }, { status: 400 });
    }
    if (!promoCode) {
      return Response.json({ ok: true, valid: false, empty: true });
    }

    const result = await resolveOptionalPromoAttribution({
      propertyId,
      promoCode,
      guestId: body.guestId,
      guestEmail: body.guestEmail,
    });

    if (!result.ok) {
      return Response.json({
        ok: true,
        valid: false,
        error: result.error,
      });
    }

    if (!result.attribution) {
      return Response.json({ ok: true, valid: false, empty: true });
    }

    return Response.json({
      ok: true,
      valid: true,
      code: result.attribution.creatorPromoCode,
      creatorName: result.attribution.creatorPartnerName,
      commissionRate: result.attribution.creatorCommissionRate,
    });
  } catch (error) {
    console.error("POST /api/creators/promo/validate:", error);
    return Response.json({ error: "Could not validate promo code" }, { status: 500 });
  }
}
