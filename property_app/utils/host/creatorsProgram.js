import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { localTodayYmd } from "@/utils/host/reservationsCalendar";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Aggregate host creator program: partners, codes, and attributed bookings.
 */
export async function buildHostCreatorsProgram(hostId) {
  const today = localTodayYmd();

  const [partners, codes, properties, bookings] = await Promise.all([
    CreatorPartner.find({ hostId, status: { $ne: "archived" } })
      .sort({ createdAt: -1 })
      .lean(),
    CreatorPromoCode.find({ hostId }).sort({ createdAt: -1 }).lean(),
    Property.find({ owner: hostId }).select("_id name images status").lean(),
    Booking.find({
      creatorHostId: hostId,
      creatorPartnerId: { $exists: true, $ne: null },
      listed: { $ne: false },
      source: { $ne: "ops_training" },
    })
      .select(
        "creatorPartnerId creatorPromoCode creatorCommissionAmount creatorCommissionBase checkIn checkOut status propertyId propertyName amount currency pricingSnapshot guestName createdAt",
      )
      .lean(),
  ]);

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

  const byPartner = new Map(
    partners.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        name: p.name,
        email: p.email || "",
        platform: p.platform || "",
        profileUrl: p.profileUrl || "",
        notes: p.notes || "",
        status: p.status,
        codes: [],
        reservations: 0,
        confirmedReservations: 0,
        completedReservations: 0,
        pendingReservations: 0,
        cancelledReservations: 0,
        bookingValue: 0,
        commissionEarned: 0,
        commissionPending: 0,
        commissionCompleted: 0,
        recentBookings: [],
      },
    ]),
  );

  for (const code of codes) {
    const partnerId = String(code.creatorPartnerId);
    const row = byPartner.get(partnerId);
    if (!row) continue;
    const prop = propertyMap.get(String(code.propertyId));
    row.codes.push({
      id: String(code._id),
      code: code.code,
      commissionRate: code.commissionRate,
      status: code.status,
      propertyId: String(code.propertyId),
      propertyName: prop?.name || "Listing",
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString() : null,
      createdAt: code.createdAt ? new Date(code.createdAt).toISOString() : null,
    });
  }

  for (const b of bookings) {
    const partnerId = String(b.creatorPartnerId);
    const row = byPartner.get(partnerId);
    if (!row) continue;
    row.reservations += 1;
    const commission = Number(b.creatorCommissionAmount) || 0;
    const value =
      Number(b.pricingSnapshot?.accommodationBase) ||
      Number(b.creatorCommissionBase) ||
      Number(b.amount) ||
      0;
    row.bookingValue = round2(row.bookingValue + value);
    row.commissionEarned = round2(row.commissionEarned + commission);

    row.recentBookings.push({
      id: String(b._id),
      guestName: b.guestName || "",
      propertyName: b.propertyName || propertyMap.get(String(b.propertyId))?.name || "Listing",
      promoCode: b.creatorPromoCode || "",
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      commission,
      bookingValue: round2(value),
      currency: b.currency || b.pricingSnapshot?.currency || "USD",
    });

    if (b.status === "cancelled") {
      row.cancelledReservations += 1;
      continue;
    }
    if (b.status === "pending") {
      row.pendingReservations += 1;
      row.commissionPending = round2(row.commissionPending + commission);
      continue;
    }
    if (b.status === "confirmed") {
      row.confirmedReservations += 1;
      if (b.checkOut && b.checkOut <= today) {
        row.completedReservations += 1;
        row.commissionCompleted = round2(row.commissionCompleted + commission);
      } else {
        row.commissionPending = round2(row.commissionPending + commission);
      }
    }
  }

  const creators = [...byPartner.values()].map((c) => ({
    ...c,
    codes: c.codes.sort((a, b) => a.code.localeCompare(b.code)),
    recentBookings: c.recentBookings
      .sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn)))
      .slice(0, 12),
  }));

  const summary = {
    creators: creators.length,
    activeCodes: codes.filter((c) => c.status === "active").length,
    reservations: creators.reduce((n, c) => n + c.reservations, 0),
    completedReservations: creators.reduce(
      (n, c) => n + c.completedReservations,
      0,
    ),
    bookingValue: round2(creators.reduce((n, c) => n + c.bookingValue, 0)),
    commissionEarned: round2(
      creators.reduce((n, c) => n + c.commissionEarned, 0),
    ),
    commissionPending: round2(
      creators.reduce((n, c) => n + c.commissionPending, 0),
    ),
    commissionCompleted: round2(
      creators.reduce((n, c) => n + c.commissionCompleted, 0),
    ),
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
