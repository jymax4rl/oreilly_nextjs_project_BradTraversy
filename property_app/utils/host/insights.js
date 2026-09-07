import Booking from "@/models/Booking";
import Property from "@/models/Property";
import PropertyAvailability from "@/models/PropertyAvailability";
import {
  addDaysYmd,
  eachDayInclusive,
  localTodayYmd,
} from "@/utils/host/reservationsCalendar";
import { countNights } from "@/utils/availability/validateStay";
import { PLATFORM_COMMISSION_RATE } from "@/utils/propertyRates";

const RANGE_DAYS = new Set([7, 30, 90]);

export function normalizeInsightRange(raw) {
  const n = Number(raw);
  return RANGE_DAYS.has(n) ? n : 30;
}

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function bookingGross(booking) {
  return money(booking?.pricingSnapshot?.total ?? booking?.amount);
}

function bookingCommission(booking) {
  return money(booking?.pricingSnapshot?.commissionAmount);
}

function bookingWaived(booking) {
  if (!booking?.pricingSnapshot?.commissionWaived) return 0;
  const base = money(booking.pricingSnapshot.accommodationBase);
  const charged = bookingCommission(booking);
  return Math.max(0, base * PLATFORM_COMMISSION_RATE - charged);
}

function bookingNights(booking) {
  const snap = money(booking?.pricingSnapshot?.nights);
  if (snap > 0) return snap;
  try {
    return countNights(booking.checkIn, booking.checkOut) || 0;
  } catch {
    return 0;
  }
}

function bookingNet(booking) {
  const base = money(booking?.pricingSnapshot?.accommodationBase);
  const cleaning = money(booking?.pricingSnapshot?.cleaningFee);
  if (base > 0 || cleaning > 0) return base + cleaning;
  return Math.max(0, bookingGross(booking) - bookingCommission(booking));
}

/** Nights of [checkIn, checkOut) that fall inside [from, toExclusive). */
function overlapNights(checkIn, checkOut, from, toExclusive) {
  if (!checkIn || !checkOut) return 0;
  const start = checkIn > from ? checkIn : from;
  const end = checkOut < toExclusive ? checkOut : toExclusive;
  if (end <= start) return 0;
  return eachDayInclusive(start, addDaysYmd(end, -1)).length;
}

function blockNights(block, from, toExclusive) {
  if (!block?.startDate || !block?.endDate) return 0;
  const blockEndExclusive = addDaysYmd(block.endDate, 1);
  return overlapNights(block.startDate, blockEndExclusive, from, toExclusive);
}

function emptyInsights({ rangeDays, from, to }) {
  return {
    rangeDays,
    from,
    to,
    currency: "USD",
    listings: 0,
    earnings: { gross: 0, net: 0, waived: 0 },
    bookings: { confirmed: 0, pending: 0, cancelled: 0 },
    occupancy: { pct: 0, bookedNights: 0, availableNights: 0 },
    adr: 0,
    today: { arriving: 0, departing: 0, inStay: 0, pending: 0 },
    byListing: [],
  };
}

/**
 * Tier-1 host insights for one owner (period economics + today ops pulse).
 */
export async function buildHostInsights(ownerId, { days = 30 } = {}) {
  const rangeDays = normalizeInsightRange(days);
  const today = localTodayYmd();
  const toExclusive = addDaysYmd(today, 1);
  const from = addDaysYmd(toExclusive, -rangeDays);

  const properties = await Property.find({ owner: ownerId })
    .select("_id name status")
    .lean();
  const propertyIds = properties.map((p) => p._id);
  const listingCount = properties.length;

  if (!listingCount) {
    return emptyInsights({ rangeDays, from, to: today });
  }

  const [periodBookings, opsBookings, availabilityDocs] = await Promise.all([
    Booking.find({
      propertyId: { $in: propertyIds },
      listed: { $ne: false },
      status: { $in: ["pending", "confirmed", "cancelled"] },
      // Overlaps the insight window
      checkIn: { $lt: toExclusive },
      checkOut: { $gt: from },
    })
      .select(
        "propertyId propertyName checkIn checkOut status listed amount pricingSnapshot",
      )
      .lean(),
    Booking.find({
      propertyId: { $in: propertyIds },
      listed: { $ne: false },
      $or: [
        { status: "pending" },
        {
          status: "confirmed",
          checkIn: { $lte: today },
          checkOut: { $gte: today },
        },
      ],
    })
      .select("checkIn checkOut status listed")
      .lean(),
    PropertyAvailability.find({ propertyId: { $in: propertyIds } })
      .select("propertyId hostBlocks")
      .lean(),
  ]);

  // Earnings / booking counts: stays that start in the window
  const startedInRange = periodBookings.filter(
    (b) => b.checkIn >= from && b.checkIn < toExclusive,
  );
  const confirmedStarted = startedInRange.filter((b) => b.status === "confirmed");
  const pendingStarted = startedInRange.filter((b) => b.status === "pending");
  const cancelledStarted = startedInRange.filter((b) => b.status === "cancelled");

  let gross = 0;
  let net = 0;
  let waived = 0;
  let adrNights = 0;
  const currencyCount = new Map();

  for (const b of confirmedStarted) {
    gross += bookingGross(b);
    net += bookingNet(b);
    waived += bookingWaived(b);
    adrNights += bookingNights(b);
    const cur = b.pricingSnapshot?.currency || b.currency || "USD";
    currencyCount.set(cur, (currencyCount.get(cur) || 0) + 1);
  }

  // Occupancy: confirmed nights overlapping the window
  let bookedNightsInRange = 0;
  for (const b of periodBookings) {
    if (b.status !== "confirmed") continue;
    bookedNightsInRange += overlapNights(b.checkIn, b.checkOut, from, toExclusive);
  }

  let blockedNights = 0;
  for (const doc of availabilityDocs) {
    for (const block of doc.hostBlocks || []) {
      blockedNights += blockNights(block, from, toExclusive);
    }
  }

  const inventoryNights = Math.max(0, listingCount * rangeDays - blockedNights);
  const occupancyPct =
    inventoryNights > 0
      ? Math.min(
          100,
          Math.round((bookedNightsInRange / inventoryNights) * 1000) / 10,
        )
      : 0;
  const adr = adrNights > 0 ? gross / adrNights : 0;

  let currency = "USD";
  let top = 0;
  for (const [cur, n] of currencyCount) {
    if (n > top) {
      top = n;
      currency = cur;
    }
  }

  const live = opsBookings.filter(
    (b) => b && b.listed !== false && (b.status === "pending" || b.status === "confirmed"),
  );
  const arriving = live.filter((b) => b.checkIn === today).length;
  const departing = live.filter(
    (b) => b.status === "confirmed" && b.checkOut === today,
  ).length;
  const inStay = live.filter(
    (b) =>
      b.status === "confirmed" && b.checkIn < today && b.checkOut > today,
  ).length;
  const pendingNow = live.filter((b) => b.status === "pending").length;

  const byListingMap = new Map(
    properties.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        name: p.name || "Listing",
        bookings: 0,
        gross: 0,
        nights: 0,
      },
    ]),
  );
  for (const b of confirmedStarted) {
    const row = byListingMap.get(String(b.propertyId));
    if (!row) continue;
    row.bookings += 1;
    row.gross += bookingGross(b);
    row.nights += bookingNights(b);
  }
  const byListing = [...byListingMap.values()]
    .filter((r) => r.bookings > 0)
    .sort((a, b) => b.gross - a.gross)
    .map((r) => ({ ...r, gross: round2(r.gross) }));

  return {
    rangeDays,
    from,
    to: today,
    currency,
    listings: listingCount,
    earnings: {
      gross: round2(gross),
      net: round2(net),
      waived: round2(waived),
    },
    bookings: {
      confirmed: confirmedStarted.length,
      pending: pendingStarted.length,
      cancelled: cancelledStarted.length,
    },
    occupancy: {
      pct: occupancyPct,
      bookedNights: bookedNightsInRange,
      availableNights: inventoryNights,
    },
    adr: round2(adr),
    today: {
      arriving,
      departing,
      inStay,
      pending: pendingNow,
    },
    byListing,
  };
}
