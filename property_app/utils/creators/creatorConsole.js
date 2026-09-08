import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import Property from "@/models/Property";
import User from "@/models/User";
import { aggregateCommissionLedger } from "@/utils/creators/commissionEngine";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";
import mongoose from "mongoose";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function pctLabel(rate) {
  return Math.round((Number(rate) || 0) * 1000) / 10;
}

/**
 * Partners linked to this Isisel user (claimed userId or matching email).
 */
export async function findCreatorPartnersForUser({ userId, email }) {
  const clauses = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    clauses.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
  const emailNorm = String(email || "")
    .trim()
    .toLowerCase();
  if (emailNorm) {
    clauses.push({ email: emailNorm });
  }
  if (!clauses.length) return [];

  return CreatorPartner.find({
    status: { $ne: "archived" },
    $or: clauses,
  })
    .sort({ updatedAt: -1 })
    .lean();
}

/**
 * Claim a host partnership invite after Google sign-in.
 */
export async function claimCreatorInvite({ token, userId, email, name }) {
  const partner = await CreatorPartner.findOne({
    portalToken: String(token || "").trim(),
    status: { $ne: "archived" },
  });
  if (!partner) {
    return { ok: false, status: 404, error: "Invite link not found or expired" };
  }

  if (partner.userId && String(partner.userId) !== String(userId)) {
    return {
      ok: false,
      status: 409,
      error: "This invite is already linked to another Isisel account",
    };
  }

  partner.userId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
  partner.claimedAt = partner.claimedAt || new Date();
  if (!partner.email && email) {
    partner.email = String(email).trim().toLowerCase().slice(0, 254);
  }
  // Soft-fill name from Google if host left a placeholder-style name
  if (name && (!partner.name || partner.name.length < 2)) {
    partner.name = String(name).trim().slice(0, 120);
  }
  await partner.save();

  return {
    ok: true,
    partner: {
      id: String(partner._id),
      name: partner.name,
      hostId: partner.hostId,
    },
  };
}

/**
 * Ensure creator has an active (or any) promo code for this property.
 */
export async function assertCreatorPropertyAccess({
  userId,
  email,
  propertyId,
}) {
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return { ok: false, status: 400, error: "Invalid property" };
  }

  const partners = await findCreatorPartnersForUser({ userId, email });
  if (!partners.length) {
    return { ok: false, status: 403, error: "Creator access required" };
  }

  const partnerIds = partners.map((p) => p._id);
  const code = await CreatorPromoCode.findOne({
    creatorPartnerId: { $in: partnerIds },
    propertyId,
    status: { $in: ["active", "paused"] },
  })
    .select("code status commissionRate creatorPartnerId hostId updatedAt")
    .lean();

  if (!code) {
    return {
      ok: false,
      status: 403,
      error: "No promo code assigned for this property",
    };
  }

  const partner = partners.find(
    (p) => String(p._id) === String(code.creatorPartnerId),
  );
  const partnerPaused = partner?.status === "paused";
  const promotionActive = !partnerPaused && code.status === "active";

  return {
    ok: true,
    code,
    partners,
    partner,
    promotionActive,
    pauseReason: partnerPaused
      ? "partnership"
      : code.status === "paused"
        ? "code"
        : null,
  };
}

/**
 * Authenticated creator console payload: all codes + property cards.
 */
export async function buildCreatorConsole({ userId, email }) {
  const partners = await findCreatorPartnersForUser({ userId, email });
  if (!partners.length) {
    return {
      empty: true,
      partnerships: [],
      properties: [],
      summary: {
        codes: 0,
        properties: 0,
        reservations: 0,
        accrued: 0,
        paid: 0,
      },
    };
  }

  // Auto-link email matches that were never claimed
  if (userId) {
    const unclaimed = partners.filter((p) => !p.userId);
    if (unclaimed.length) {
      await CreatorPartner.updateMany(
        { _id: { $in: unclaimed.map((p) => p._id) }, userId: null },
        { $set: { userId, claimedAt: new Date() } },
      );
    }
  }

  const partnerIds = partners.map((p) => p._id);
  const codes = await CreatorPromoCode.find({
    creatorPartnerId: { $in: partnerIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const propertyIds = [
    ...new Set(codes.map((c) => String(c.propertyId)).filter(Boolean)),
  ];

  const [properties, hostUsers, ledgers] = await Promise.all([
    propertyIds.length
      ? Property.find({ _id: { $in: propertyIds } })
          .select("name images location status")
          .lean()
      : [],
    User.find({
      _id: {
        $in: partners
          .map((p) => p.hostId)
          .filter((id) => mongoose.Types.ObjectId.isValid(id)),
      },
    })
      .select("username email")
      .lean(),
    Promise.all(
      partners.map((p) =>
        aggregateCommissionLedger({
          hostId: p.hostId,
          creatorPartnerId: p._id,
        }),
      ),
    ),
  ]);

  const propertyMap = new Map(
    properties.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        name: p.name || "Listing",
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
        city: p.location?.city || "",
        country: p.location?.country || "",
        status: p.status,
      },
    ]),
  );

  const hostMap = new Map(
    hostUsers.map((h) => [
      String(h._id),
      h.username || h.email || "Host",
    ]),
  );

  const partnerships = partners.map((p, index) => {
    const ledger = ledgers[index];
    const partnerStats = ledger.byPartner.find(
      (row) => row.id === String(p._id),
    ) || {
      reservations: 0,
      amount: 0,
      gbv: 0,
      accrued: 0,
      paid: 0,
    };
    const partnerCodes = codes
      .filter((c) => String(c.creatorPartnerId) === String(p._id))
      .map((c) => {
        const prop = propertyMap.get(String(c.propertyId));
        return {
          id: String(c._id),
          code: c.code,
          commissionRate: c.commissionRate,
          commissionPercent: pctLabel(c.commissionRate),
          status: c.status,
          propertyId: String(c.propertyId),
          property: prop || {
            id: String(c.propertyId),
            name: "Listing",
            image: null,
            city: "",
            country: "",
          },
          expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
          updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
        };
      });

    const partnerPaused = p.status === "paused";

    return {
      id: String(p._id),
      name: p.name,
      platform: p.platform || "",
      status: p.status,
      hostName: hostMap.get(String(p.hostId)) || "Host",
      hostId: p.hostId,
      claimed: Boolean(p.userId),
      paused: partnerPaused,
      codes: partnerCodes.map((c) => ({
        ...c,
        // Partnership pause freezes every code for this creator
        effectiveStatus: partnerPaused ? "paused" : c.status,
      })),
      stats: {
        reservations: partnerStats.reservations,
        accrued: round2(partnerStats.accrued),
        paid: round2(partnerStats.paid),
        gbv: round2(partnerStats.gbv),
      },
      recentBookings: (ledger.recent || [])
        .filter((r) => r.creatorPartnerId === String(p._id))
        .slice(0, 8),
    };
  });

  const partnerById = new Map(partnerships.map((p) => [p.id, p]));

  const propertyCards = propertyIds.map((id) => {
    const prop = propertyMap.get(id) || {
      id,
      name: "Listing",
      image: null,
      city: "",
      country: "",
    };
    const related = codes.filter((c) => String(c.propertyId) === id);
    const codeRows = related.map((c) => {
      const partner = partnerById.get(String(c.creatorPartnerId));
      const partnerPaused = partner?.paused || partner?.status === "paused";
      const effectiveStatus = partnerPaused ? "paused" : c.status;
      return {
        code: c.code,
        status: c.status,
        effectiveStatus,
        commissionPercent: pctLabel(c.commissionRate),
        partnerId: String(c.creatorPartnerId),
        hostName: partner?.hostName || "Host",
        updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
      };
    });
    const hasActive = codeRows.some((c) => c.effectiveStatus === "active");
    const pausedCodes = codeRows.filter((c) => c.effectiveStatus === "paused");
    return {
      ...prop,
      codes: codeRows,
      promotionActive: hasActive,
      paused: !hasActive && pausedCodes.length > 0,
      pausedCodes: pausedCodes.map((c) => c.code),
    };
  });

  const pausedAlerts = [];
  for (const p of partnerships) {
    if (p.paused) {
      pausedAlerts.push({
        type: "partner",
        id: p.id,
        hostName: p.hostName,
        message: `${p.hostName} paused your partnership — do not promote their listings until they resume you.`,
      });
    }
    for (const c of p.codes) {
      if (c.effectiveStatus === "paused" && !p.paused) {
        pausedAlerts.push({
          type: "code",
          id: c.id,
          code: c.code,
          propertyName: c.property?.name || "Listing",
          hostName: p.hostName,
          message: `${p.hostName} paused promo code ${c.code} on ${c.property?.name || "a listing"} — guests who book won’t attribute to you until it’s active again.`,
          updatedAt: c.updatedAt,
        });
      }
    }
  }

  const summary = {
    codes: codes.length,
    activeCodes: partnerships.reduce(
      (n, p) =>
        n + p.codes.filter((c) => c.effectiveStatus === "active").length,
      0,
    ),
    pausedCodes: partnerships.reduce(
      (n, p) =>
        n + p.codes.filter((c) => c.effectiveStatus === "paused").length,
      0,
    ),
    properties: propertyCards.length,
    reservations: partnerships.reduce((n, p) => n + p.stats.reservations, 0),
    accrued: round2(partnerships.reduce((n, p) => n + p.stats.accrued, 0)),
    paid: round2(partnerships.reduce((n, p) => n + p.stats.paid, 0)),
  };

  return {
    empty: false,
    summary,
    partnerships,
    properties: propertyCards,
    alerts: pausedAlerts,
  };
}

/**
 * Availability for a property the creator is assigned to (bypasses public catalog gate).
 */
export async function getCreatorPropertyAvailability(propertyId) {
  const property = await Property.findById(propertyId)
    .select("name images location status")
    .lean();
  if (!property) {
    return { ok: false, status: 404, error: "Property not found" };
  }

  const payload = await getAvailabilityPayload(propertyId, { isOwner: false });
  return {
    ok: true,
    property: {
      id: String(property._id),
      name: property.name || "Listing",
      image: Array.isArray(property.images) && property.images[0]
        ? property.images[0]
        : null,
      city: property.location?.city || "",
      country: property.location?.country || "",
    },
    unavailableRanges: payload.unavailableRanges || [],
    defaultAvailability: payload.defaultAvailability,
  };
}

/**
 * Enrich token portal with property availability for assigned codes.
 */
export async function enrichPortalWithAvailability(portal) {
  if (!portal?.codes?.length) return portal;

  const propertyIds = [
    ...new Set(portal.codes.map((c) => String(c.propertyId)).filter(Boolean)),
  ];

  const properties = propertyIds.length
    ? await Property.find({ _id: { $in: propertyIds } })
        .select("name images location")
        .lean()
    : [];

  const propertyMap = new Map(
    properties.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        name: p.name || "Listing",
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
        city: p.location?.city || "",
        country: p.location?.country || "",
      },
    ]),
  );

  const availSettled = await Promise.all(
    propertyIds.map(async (id) => {
      try {
        const payload = await getAvailabilityPayload(id, { isOwner: false });
        return [
          id,
          {
            unavailableRanges: payload.unavailableRanges || [],
          },
        ];
      } catch {
        return [id, { unavailableRanges: [] }];
      }
    }),
  );
  const availMap = new Map(availSettled);

  return {
    ...portal,
    properties: propertyIds.map((id) => {
      const codesForProp = portal.codes.filter(
        (c) => String(c.propertyId) === id,
      );
      const hasActive = codesForProp.some((c) => c.status === "active");
      return {
        ...(propertyMap.get(id) || { id, name: "Listing", image: null }),
        codes: codesForProp,
        unavailableRanges: availMap.get(id)?.unavailableRanges || [],
        promotionActive: hasActive,
        paused: !hasActive && codesForProp.some((c) => c.status === "paused"),
        pausedCodes: codesForProp
          .filter((c) => c.status === "paused")
          .map((c) => c.code),
      };
    }),
    alerts: (portal.codes || [])
      .filter((c) => c.status === "paused")
      .map((c) => ({
        type: "code",
        code: c.code,
        message: `Promo code ${c.code} is paused by the host — do not promote until it’s active again.`,
      })),
  };
}
