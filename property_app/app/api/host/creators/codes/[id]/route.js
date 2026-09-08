import connectToDatabase from "@/config/database";
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

const STATUSES = new Set(["active", "paused", "expired"]);

function parseRateFraction(raw, { allowZero = false } = {}) {
  let rate = Number(raw);
  if (!Number.isFinite(rate)) return null;
  if (rate > 1) rate = rate / 100;
  if (allowZero) {
    if (rate < 0 || rate > 0.5) return null;
  } else if (rate <= 0 || rate > 0.5) {
    return null;
  }
  return Math.round(rate * 10000) / 10000;
}

/**
 * PATCH /api/host/creators/codes/[id]
 * Pause / resume, update commission %, guest discount %, property, notes, expiry.
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
      const rate = parseRateFraction(
        body.commissionRatePercent ?? body.commissionRate,
      );
      if (rate == null) {
        return Response.json(
          { error: "Commission must be between 1% and 50%" },
          { status: 400 },
        );
      }
      promo.commissionRate = rate;
    }

    if (
      body.guestDiscountRatePercent != null ||
      body.guestDiscountRate != null
    ) {
      const rate = parseRateFraction(
        body.guestDiscountRatePercent ?? body.guestDiscountRate,
        { allowZero: true },
      );
      if (rate == null) {
        return Response.json(
          { error: "Guest discount must be between 0% and 50%" },
          { status: 400 },
        );
      }
      promo.guestDiscountRate = rate;
    }

    if (body.propertyId != null && body.propertyId !== "") {
      const propertyId = String(body.propertyId);
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return Response.json({ error: "Select a property" }, { status: 400 });
      }
      const property = await Property.findOne({
        _id: propertyId,
        owner: session.user.id,
      })
        .select("_id name")
        .lean();
      if (!property) {
        return Response.json({ error: "Property not found" }, { status: 404 });
      }
      promo.propertyId = property._id;
    }

    if (body.code != null && String(body.code).trim() !== "") {
      const nextCode = normalizePromoCode(body.code);
      if (!isValidPromoCodeFormat(nextCode)) {
        return Response.json(
          {
            error:
              "Promo code must be 2–32 characters: letters, numbers, _ or -",
          },
          { status: 400 },
        );
      }
      if (nextCode !== promo.code) {
        const taken = await CreatorPromoCode.findOne({
          code: nextCode,
          _id: { $ne: promo._id },
        })
          .select("_id")
          .lean();
        if (taken) {
          return Response.json(
            { error: "That promo code is already in use" },
            { status: 409 },
          );
        }
        promo.code = nextCode;
      }
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

    const property = await Property.findById(promo.propertyId)
      .select("name")
      .lean();

    return Response.json({
      id: String(promo._id),
      code: promo.code,
      commissionRate: promo.commissionRate,
      guestDiscountRate: promo.guestDiscountRate,
      status: promo.status,
      propertyId: String(promo.propertyId),
      propertyName: property?.name || "Listing",
      creatorPartnerId: String(promo.creatorPartnerId),
      expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
      notes: promo.notes || "",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json(
        { error: "That promo code is already in use" },
        { status: 409 },
      );
    }
    console.error("PATCH /api/host/creators/codes/[id]:", error);
    return Response.json({ error: "Could not update promo code" }, { status: 500 });
  }
}
