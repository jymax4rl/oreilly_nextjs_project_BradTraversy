import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import CreatorCommission from "@/models/CreatorCommission";
import Property from "@/models/Property";
import { aggregateCommissionLedger } from "@/utils/creators/commissionEngine";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Host creator program dashboard — Mongo $facet for ledger KPIs,
 * parallel partner/code loads for assignment UI.
 */
export async function buildHostCreatorsProgram(hostId) {
  const [partners, codes, properties, ledger] = await Promise.all([
    CreatorPartner.find({ hostId, status: { $ne: "archived" } })
      .sort({ createdAt: -1 })
      .lean(),
    CreatorPromoCode.find({ hostId }).sort({ createdAt: -1 }).lean(),
    Property.find({ owner: hostId }).select("_id name images status").lean(),
    aggregateCommissionLedger({ hostId }),
  ]);

  // Per-partner reservation roll-up from ledger (single aggregation already done).
  const partnerLedger = new Map(
    (ledger.byPartner || []).map((p) => [p.id, p]),
  );

  // Booking-status breakdown for intuitive host cards (pending stay vs accrued).
  const partnerStatusRows = await CreatorCommission.aggregate([
    { $match: { hostId: String(hostId) } },
    {
      $group: {
        _id: {
          partnerId: "$creatorPartnerId",
          status: "$status",
        },
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
  ]);

  const statusByPartner = new Map();
  for (const row of partnerStatusRows) {
    const id = String(row._id.partnerId);
    if (!statusByPartner.has(id)) statusByPartner.set(id, {});
    statusByPartner.get(id)[row._id.status] = {
      count: row.count,
      amount: round2(row.amount),
    };
  }

  const propertyMap = new Map(
    properties.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        name: p.name || "Listing",
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
        status: p.status,
      },
    ]),
  );

  const creators = partners.map((p) => {
    const id = String(p._id);
    const stats = partnerLedger.get(id) || {
      reservations: 0,
      amount: 0,
      gbv: 0,
      accrued: 0,
      paid: 0,
      pendingStay: 0,
    };
    const byStatus = statusByPartner.get(id) || {};
    const partnerCodes = codes
      .filter((c) => String(c.creatorPartnerId) === id)
      .map((code) => {
        const prop = propertyMap.get(String(code.propertyId));
        return {
          id: String(code._id),
          code: code.code,
          commissionRate: code.commissionRate,
          status: code.status,
          propertyId: String(code.propertyId),
          propertyName: prop?.name || "Listing",
          expiresAt: code.expiresAt
            ? new Date(code.expiresAt).toISOString()
            : null,
          createdAt: code.createdAt
            ? new Date(code.createdAt).toISOString()
            : null,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      id,
      name: p.name,
      email: p.email || "",
      platform: p.platform || "",
      profileUrl: p.profileUrl || "",
      notes: p.notes || "",
      status: p.status,
      portalToken: p.portalToken || null,
      portalUrl: p.portalToken
        ? `/creators/portal/${p.portalToken}`
        : null,
      joinUrl: p.portalToken ? `/creators/join/${p.portalToken}` : null,
      codes: partnerCodes,
      reservations: stats.reservations,
      confirmedReservations:
        (byStatus.pending_stay?.count || 0) +
        (byStatus.accrued?.count || 0) +
        (byStatus.approved?.count || 0) +
        (byStatus.payable?.count || 0) +
        (byStatus.paid?.count || 0),
      completedReservations:
        (byStatus.accrued?.count || 0) +
        (byStatus.approved?.count || 0) +
        (byStatus.payable?.count || 0) +
        (byStatus.paid?.count || 0),
      pendingReservations: byStatus.pending_stay?.count || 0,
      cancelledReservations: byStatus.reversed?.count || 0,
      bookingValue: stats.gbv,
      commissionEarned: stats.amount,
      commissionPending: round2(
        (byStatus.pending_stay?.amount || 0) +
          (byStatus.accrued?.amount || 0) +
          (byStatus.approved?.amount || 0) +
          (byStatus.payable?.amount || 0),
      ),
      commissionCompleted: round2(
        (byStatus.accrued?.amount || 0) +
          (byStatus.approved?.amount || 0) +
          (byStatus.payable?.amount || 0) +
          (byStatus.paid?.amount || 0),
      ),
      commissionPaid: stats.paid,
      commissionAccrued: stats.accrued,
      ledgerByStatus: byStatus,
      recentBookings: (ledger.recent || [])
        .filter((r) => r.creatorPartnerId === id)
        .slice(0, 12)
        .map((b) => ({
          id: b.bookingId,
          guestName: b.guestName,
          propertyName: b.propertyName,
          promoCode: b.promoCode,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.bookingStatus,
          commissionStatus: b.status,
          commission: b.amount,
          bookingValue: b.accommodationBase,
          currency: b.currency,
        })),
    };
  });

  const summary = {
    creators: creators.length,
    activeCodes: codes.filter((c) => c.status === "active").length,
    reservations: ledger.summary.reservations,
    completedReservations: creators.reduce(
      (n, c) => n + c.completedReservations,
      0,
    ),
    bookingValue: ledger.summary.gbv,
    commissionEarned: round2(
      (ledger.summary.pendingStay || 0) +
        (ledger.summary.accrued || 0) +
        (ledger.summary.approved || 0) +
        (ledger.summary.payable || 0) +
        (ledger.summary.paid || 0),
    ),
    commissionPending: round2(
      (ledger.summary.pendingStay || 0) +
        (ledger.summary.accrued || 0) +
        (ledger.summary.approved || 0) +
        (ledger.summary.payable || 0),
    ),
    commissionCompleted: round2(
      (ledger.summary.accrued || 0) +
        (ledger.summary.approved || 0) +
        (ledger.summary.payable || 0) +
        (ledger.summary.paid || 0),
    ),
    commissionPaid: ledger.summary.paid,
    commissionAccrued: ledger.summary.accrued,
    ledger: ledger.summary,
  };

  return {
    summary,
    creators,
    properties: properties.map((p) => ({
      id: String(p._id),
      name: p.name || "Listing",
      status: p.status,
    })),
  };
}
