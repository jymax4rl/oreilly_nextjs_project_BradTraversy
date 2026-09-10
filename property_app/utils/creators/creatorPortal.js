import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import { aggregateCommissionLedger } from "@/utils/creators/commissionEngine";

/**
 * Read-only creator portal payload (token-gated, no login required for MVP).
 */
export async function buildCreatorPortal(token) {
  const partner = await CreatorPartner.findOne({
    portalToken: String(token || "").trim(),
    status: { $ne: "archived" },
  }).lean();

  if (!partner) return null;

  const [codes, ledger] = await Promise.all([
    CreatorPromoCode.find({
      creatorPartnerId: partner._id,
      hostId: partner.hostId,
    })
      .sort({ createdAt: -1 })
      .lean(),
    aggregateCommissionLedger({
      hostId: partner.hostId,
      creatorPartnerId: partner._id,
    }),
  ]);

  const partnerStats = ledger.byPartner.find(
    (p) => p.id === String(partner._id),
  ) || {
    reservations: 0,
    amount: 0,
    gbv: 0,
    accrued: 0,
    paid: 0,
    pendingStay: 0,
  };

  return {
    creator: {
      id: String(partner._id),
      name: partner.name,
      platform: partner.platform || "",
      profileUrl: partner.profileUrl || "",
      status: partner.status,
    },
    summary: {
      clicks: null, // Phase 2 — funnel events not yet linked per partner
      reservations: partnerStats.reservations,
      accrued: partnerStats.accrued,
      paid: partnerStats.paid,
      pending: Math.round(
        ((partnerStats.amount || 0) - (partnerStats.paid || 0)) * 100,
      ) / 100,
      gbv: partnerStats.gbv,
      ledger: ledger.summary,
    },
    codes: codes.map((c) => ({
      code: c.code,
      commissionRate: c.commissionRate,
      status: c.status,
      propertyId: String(c.propertyId),
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    })),
    bookings: ledger.recent.filter(
      (r) => r.creatorPartnerId === String(partner._id),
    ),
  };
}
