import connectToDatabase from "@/config/database";
import {
  normalizePromoCode,
  resolveOptionalPromoAttribution,
  applyGuestPromoDiscount,
} from "@/utils/creators/promoAttribution";

/**
 * POST /api/creators/promo/validate
 * Guest-facing soft check before reserve (does not consume the code).
 * Returns guestDiscountRate so the listing price can update immediately.
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId;
    const promoCode = normalizePromoCode(body.promoCode || body.code);
    const accommodationBase = Number(body.accommodationBase);

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

    const guestDiscountRate = Number(
      result.attribution.guestDiscountRate || 0,
    );
    const preview =
      Number.isFinite(accommodationBase) && accommodationBase > 0
        ? applyGuestPromoDiscount(accommodationBase, guestDiscountRate)
        : null;

    return Response.json({
      ok: true,
      valid: true,
      code: result.attribution.creatorPromoCode,
      creatorName: result.attribution.creatorPartnerName,
      commissionRate: result.attribution.creatorCommissionRate,
      guestDiscountRate,
      guestDiscountPercent: Math.round(guestDiscountRate * 1000) / 10,
      preview: preview
        ? {
            originalBase: preview.originalBase,
            discountedBase: preview.discountedBase,
            guestDiscountAmount: preview.guestDiscountAmount,
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/creators/promo/validate:", error);
    return Response.json({ error: "Could not validate promo code" }, { status: 500 });
  }
}
