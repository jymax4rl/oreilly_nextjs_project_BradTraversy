import connectToDatabase from "@/config/database";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";

const STATUSES = new Set(["active", "paused", "expired"]);

/**
 * PATCH /api/host/creators/codes/[id] — pause / resume / update rate
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid code id" }, { status: 400 });
    }

    const promo = await CreatorPromoCode.findOne({
      _id: id,
      hostId: session.user.id,
    });
    if (!promo) {
      return Response.json({ error: "Promo code not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.status != null) {
      const status = String(body.status).trim();
      if (!STATUSES.has(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      promo.status = status;
    }

    if (body.commissionRatePercent != null || body.commissionRate != null) {
      let rate = Number(body.commissionRatePercent ?? body.commissionRate);
      if (Number.isFinite(rate) && rate > 1) rate = rate / 100;
      if (!Number.isFinite(rate) || rate <= 0 || rate > 0.5) {
        return Response.json(
          { error: "Commission must be between 1% and 50%" },
          { status: 400 },
        );
      }
      promo.commissionRate = Math.round(rate * 10000) / 10000;
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === "") {
        promo.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (Number.isNaN(d.getTime())) {
          return Response.json({ error: "Invalid expiry date" }, { status: 400 });
        }
        promo.expiresAt = d;
      }
    }

    if (body.notes != null) {
      promo.notes = String(body.notes).trim().slice(0, 500);
    }

    await promo.save();

    return Response.json({
      id: String(promo._id),
      code: promo.code,
      commissionRate: promo.commissionRate,
      status: promo.status,
      propertyId: String(promo.propertyId),
      creatorPartnerId: String(promo.creatorPartnerId),
      expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
    });
  } catch (error) {
    console.error("PATCH /api/host/creators/codes/[id]:", error);
    return Response.json({ error: "Could not update promo code" }, { status: 500 });
  }
}
