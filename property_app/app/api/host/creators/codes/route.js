import connectToDatabase from "@/config/database";
import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import Property from "@/models/Property";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import {
  isValidPromoCodeFormat,
  normalizePromoCode,
} from "@/utils/creators/promoAttribution";

/**
 * POST /api/host/creators/codes — assign a promo code to a property + creator
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const body = await request.json().catch(() => ({}));
    const hostId = session.user.id;
    const code = normalizePromoCode(body.code);
    const creatorPartnerId = String(body.creatorPartnerId || "");
    const propertyId = String(body.propertyId || "");
    const ratePct = Number(body.commissionRatePercent ?? body.commissionRate);
    // Accept either 10 (percent) or 0.1 (fraction)
    let commissionRate = ratePct;
    if (Number.isFinite(ratePct) && ratePct > 1) {
      commissionRate = ratePct / 100;
    }

    if (!isValidPromoCodeFormat(code)) {
      return Response.json(
        {
          error:
            "Promo code must be 2–32 characters: letters, numbers, _ or -",
        },
        { status: 400 },
      );
    }
    if (!mongoose.Types.ObjectId.isValid(creatorPartnerId)) {
      return Response.json({ error: "Select a creator" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return Response.json({ error: "Select a property" }, { status: 400 });
    }
    if (
      !Number.isFinite(commissionRate) ||
      commissionRate <= 0 ||
      commissionRate > 0.5
    ) {
      return Response.json(
        { error: "Commission must be between 1% and 50%" },
        { status: 400 },
      );
    }

    const [partner, property] = await Promise.all([
      CreatorPartner.findOne({ _id: creatorPartnerId, hostId }).lean(),
      Property.findOne({ _id: propertyId, owner: hostId }).select("_id name").lean(),
    ]);

    if (!partner || partner.status === "archived") {
      return Response.json({ error: "Creator not found" }, { status: 404 });
    }
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const existing = await CreatorPromoCode.findOne({ code }).lean();
    if (existing) {
      return Response.json(
        { error: "That promo code is already in use" },
        { status: 409 },
      );
    }

    let expiresAt = null;
    if (body.expiresAt) {
      const d = new Date(body.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return Response.json({ error: "Invalid expiry date" }, { status: 400 });
      }
      expiresAt = d;
    }

    const promo = await CreatorPromoCode.create({
      hostId,
      creatorPartnerId,
      propertyId,
      code,
      commissionRate: Math.round(commissionRate * 10000) / 10000,
      status: "active",
      expiresAt,
      notes: String(body.notes || "").trim().slice(0, 500),
    });

    return Response.json(
      {
        id: String(promo._id),
        code: promo.code,
        commissionRate: promo.commissionRate,
        status: promo.status,
        propertyId: String(promo.propertyId),
        propertyName: property.name || "Listing",
        creatorPartnerId: String(promo.creatorPartnerId),
        expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json(
        { error: "That promo code is already in use" },
        { status: 409 },
      );
    }
    console.error("POST /api/host/creators/codes:", error);
    return Response.json({ error: "Could not create promo code" }, { status: 500 });
  }
}
