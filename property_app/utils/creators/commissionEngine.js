import crypto from "crypto";
import mongoose from "mongoose";
import CreatorCommission from "@/models/CreatorCommission";
import Booking from "@/models/Booking";
import { localTodayYmd } from "@/utils/host/reservationsCalendar";
import { TRAINING_BOOKING_SOURCE } from "@/utils/opsTraining/constants";

export const COMMISSION_TRANSITIONS = Object.freeze({
  pending_stay: ["accrued", "reversed", "on_hold"],
  accrued: ["approved", "on_hold", "reversed"],
  on_hold: ["accrued", "approved", "reversed"],
  approved: ["payable", "on_hold", "reversed"],
  payable: ["paid", "on_hold", "reversed"],
  paid: ["reversed"],
  reversed: [],
});

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function pushHistory(doc, status, by, note = "") {
  doc.statusHistory = doc.statusHistory || [];
  doc.statusHistory.push({
    status,
    at: new Date(),
    by: by || "system",
    note: String(note || "").slice(0, 400),
  });
}

/**
 * Build ledger fields from an attributed booking document.
 */
export function commissionPayloadFromBooking(booking) {
  if (!booking?.creatorPartnerId || !booking?.creatorHostId) return null;
  if (booking.creatorAttributionStatus === "void") return null;
  if (booking.source === TRAINING_BOOKING_SOURCE) return null;

  const base =
    Number(booking.creatorCommissionBase) ||
    Number(booking.pricingSnapshot?.accommodationBase) ||
    0;
  const rate = Number(booking.creatorCommissionRate) || 0;
  const amount =
    Number(booking.creatorCommissionAmount) || round2(base * rate);

  return {
    bookingId: booking._id,
    hostId: String(booking.creatorHostId),
    creatorPartnerId: booking.creatorPartnerId,
    creatorPartnerName: booking.creatorPartnerName || "",
    propertyId: booking.propertyId,
    propertyName: booking.propertyName || "",
    promoCode: booking.creatorPromoCode || "",
    creatorPromoCodeId: booking.creatorPromoCodeId || undefined,
    rate,
    accommodationBase: round2(base),
    amount: round2(amount),
    currency: (
      booking.pricingSnapshot?.currency ||
      booking.currency ||
      "USD"
    ).toUpperCase(),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.pricingSnapshot?.nights,
    guestName: booking.guestName || "",
    bookingStatus: booking.status,
  };
}

function resolveInitialStatus(booking, today = localTodayYmd()) {
  if (booking.status === "cancelled") return "reversed";
  if (
    booking.status === "confirmed" &&
    booking.checkOut &&
    booking.checkOut <= today &&
    booking.refundStatus !== "completed"
  ) {
    return "accrued";
  }
  return "pending_stay";
}

/**
 * Idempotent upsert of CreatorCommission for an attributed booking.
 */
export async function upsertCommissionForBooking(booking, { actor = "system" } = {}) {
  const payload = commissionPayloadFromBooking(booking);
  if (!payload) return { ok: false, skipped: true };

  const today = localTodayYmd();
  const nextStatus = resolveInitialStatus(booking, today);
  const existing = await CreatorCommission.findOne({
    bookingId: booking._id,
  });

  if (!existing) {
    const doc = await CreatorCommission.create({
      ...payload,
      status: nextStatus,
      statusHistory: [
        {
          status: nextStatus,
          at: new Date(),
          by: actor,
          note: "created",
        },
      ],
      accruedAt: nextStatus === "accrued" ? new Date() : undefined,
    });
    return { ok: true, created: true, commission: doc.toObject() };
  }

  // Never reopen paid/reversed via upsert except booking sync fields.
  if (existing.status === "paid" || existing.status === "reversed") {
    existing.bookingStatus = booking.status;
    await existing.save();
    return { ok: true, created: false, commission: existing.toObject() };
  }

  let changed = false;
  for (const key of [
    "creatorPartnerName",
    "propertyName",
    "promoCode",
    "rate",
    "accommodationBase",
    "amount",
    "currency",
    "checkIn",
    "checkOut",
    "nights",
    "guestName",
    "bookingStatus",
  ]) {
    if (payload[key] != null && existing[key] !== payload[key]) {
      existing[key] = payload[key];
      changed = true;
    }
  }

  if (
    nextStatus === "accrued" &&
    existing.status === "pending_stay"
  ) {
    existing.status = "accrued";
    existing.accruedAt = new Date();
    pushHistory(existing, "accrued", actor, "post-stay finalize");
    changed = true;
  } else if (
    nextStatus === "reversed" &&
    existing.status !== "reversed"
  ) {
    existing.status = "reversed";
    pushHistory(existing, "reversed", actor, "booking cancelled");
    changed = true;
  }

  if (changed) await existing.save();
  return { ok: true, created: false, commission: existing.toObject() };
}

/**
 * Post-stay finalize using aggregation — finds eligible bookings in one pass.
 * Efficient: $lookup existing ledger, only process pending/missing rows.
 */
export async function finalizeEligibleCommissions({
  today = localTodayYmd(),
  actor = "system",
  limit = 500,
} = {}) {
  const rows = await Booking.aggregate([
    {
      $match: {
        creatorAttributionStatus: "attributed",
        creatorPartnerId: { $exists: true, $ne: null },
        creatorHostId: { $exists: true, $ne: null },
        status: "confirmed",
        listed: { $ne: false },
        source: { $ne: TRAINING_BOOKING_SOURCE },
        checkOut: { $lte: today },
        refundStatus: { $ne: "completed" },
      },
    },
    {
      $lookup: {
        from: "CreatorCommissions",
        localField: "_id",
        foreignField: "bookingId",
        as: "ledger",
      },
    },
    {
      $addFields: {
        ledgerDoc: { $arrayElemAt: ["$ledger", 0] },
      },
    },
    {
      $match: {
        $or: [
          { ledger: { $size: 0 } },
          { "ledgerDoc.status": "pending_stay" },
        ],
      },
    },
    { $sort: { checkOut: 1 } },
    { $limit: limit },
    {
      $project: {
        ledger: 0,
      },
    },
  ]);

  let accrued = 0;
  let created = 0;
  for (const booking of rows) {
    const result = await upsertCommissionForBooking(booking, { actor });
    if (result.created) created += 1;
    if (result.commission?.status === "accrued") accrued += 1;
  }

  return {
    ok: true,
    scanned: rows.length,
    created,
    accrued,
    today,
  };
}

/**
 * Reverse (or void) commission when a booking is cancelled.
 */
export async function reverseCommissionForBooking(
  booking,
  { actor = "system", note = "booking cancelled" } = {},
) {
  if (!booking?._id) return { ok: false };

  if (booking.creatorAttributionStatus === "attributed") {
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { creatorAttributionStatus: "void" } },
    );
  }

  const existing = await CreatorCommission.findOne({ bookingId: booking._id });
  if (!existing) {
    // Still create a reversed row for audit if attribution existed.
    if (booking.creatorPartnerId && booking.creatorHostId) {
      const payload = commissionPayloadFromBooking({
        ...booking,
        creatorAttributionStatus: "attributed",
      });
      if (payload) {
        await CreatorCommission.create({
          ...payload,
          status: "reversed",
          bookingStatus: "cancelled",
          statusHistory: [
            {
              status: "reversed",
              at: new Date(),
              by: actor,
              note,
            },
          ],
        });
      }
    }
    return { ok: true, reversed: true };
  }

  if (existing.status === "reversed") {
    existing.bookingStatus = "cancelled";
    await existing.save();
    return { ok: true, reversed: false };
  }

  if (existing.status === "paid") {
    existing.status = "reversed";
    existing.bookingStatus = "cancelled";
    pushHistory(existing, "reversed", actor, `${note} (clawback)`);
    await existing.save();
    return { ok: true, reversed: true, clawback: true };
  }

  existing.status = "reversed";
  existing.bookingStatus = "cancelled";
  pushHistory(existing, "reversed", actor, note);
  await existing.save();
  return { ok: true, reversed: true };
}

/**
 * Controlled status transition for ops payout workflow.
 */
export async function transitionCommissionStatus(
  commissionId,
  nextStatus,
  { actor = "ops", note = "", payoutReference = "" } = {},
) {
  const doc = await CreatorCommission.findById(commissionId);
  if (!doc) return { ok: false, error: "Commission not found", status: 404 };

  const allowed = COMMISSION_TRANSITIONS[doc.status] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot move from ${doc.status} to ${nextStatus}`,
      status: 400,
    };
  }

  doc.status = nextStatus;
  pushHistory(doc, nextStatus, actor, note);
  if (nextStatus === "accrued" && !doc.accruedAt) doc.accruedAt = new Date();
  if (nextStatus === "approved") doc.approvedAt = new Date();
  if (nextStatus === "paid") {
    doc.paidAt = new Date();
    if (payoutReference) doc.payoutReference = String(payoutReference).slice(0, 120);
  }
  if (nextStatus === "on_hold" && note) {
    doc.holdReason = String(note).slice(0, 400);
  }
  await doc.save();
  return { ok: true, commission: doc.toObject() };
}

/**
 * Ops / host ledger KPIs via single $facet aggregation.
 */
export async function aggregateCommissionLedger({
  hostId,
  creatorPartnerId,
} = {}) {
  const match = {};
  if (hostId) match.hostId = String(hostId);
  if (creatorPartnerId) {
    match.creatorPartnerId = mongoose.Types.ObjectId.isValid(creatorPartnerId)
      ? new mongoose.Types.ObjectId(creatorPartnerId)
      : creatorPartnerId;
  }

  const [row] = await CreatorCommission.aggregate([
    { $match: match },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
              gbv: { $sum: "$accommodationBase" },
            },
          },
        ],
        byPartner: [
          {
            $group: {
              _id: "$creatorPartnerId",
              name: { $first: "$creatorPartnerName" },
              reservations: { $sum: 1 },
              amount: { $sum: "$amount" },
              gbv: { $sum: "$accommodationBase" },
              accrued: {
                $sum: {
                  $cond: [{ $eq: ["$status", "accrued"] }, "$amount", 0],
                },
              },
              paid: {
                $sum: {
                  $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
                },
              },
              pendingStay: {
                $sum: {
                  $cond: [{ $eq: ["$status", "pending_stay"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { amount: -1 } },
        ],
        recent: [
          { $sort: { updatedAt: -1 } },
          { $limit: 40 },
          {
            $project: {
              bookingId: 1,
              creatorPartnerId: 1,
              creatorPartnerName: 1,
              propertyName: 1,
              promoCode: 1,
              amount: 1,
              accommodationBase: 1,
              currency: 1,
              status: 1,
              checkIn: 1,
              checkOut: 1,
              guestName: 1,
              bookingStatus: 1,
            },
          },
        ],
      },
    },
  ]);

  const byStatus = Object.fromEntries(
    (row?.byStatus || []).map((s) => [
      s._id,
      {
        count: s.count,
        amount: round2(s.amount),
        gbv: round2(s.gbv),
      },
    ]),
  );

  const summary = {
    reservations: (row?.byStatus || []).reduce((n, s) => n + s.count, 0),
    gbv: round2((row?.byStatus || []).reduce((n, s) => n + (s.gbv || 0), 0)),
    accrued: byStatus.accrued?.amount || 0,
    approved: byStatus.approved?.amount || 0,
    payable: byStatus.payable?.amount || 0,
    paid: byStatus.paid?.amount || 0,
    pendingStay: byStatus.pending_stay?.amount || 0,
    onHold: byStatus.on_hold?.amount || 0,
    reversed: byStatus.reversed?.amount || 0,
    byStatus,
  };

  return {
    summary,
    byPartner: (row?.byPartner || []).map((p) => ({
      id: String(p._id),
      name: p.name || "",
      reservations: p.reservations,
      amount: round2(p.amount),
      gbv: round2(p.gbv),
      accrued: round2(p.accrued),
      paid: round2(p.paid),
      pendingStay: p.pendingStay,
    })),
    recent: (row?.recent || []).map((c) => ({
      id: String(c._id),
      bookingId: String(c.bookingId),
      creatorPartnerId: String(c.creatorPartnerId),
      creatorPartnerName: c.creatorPartnerName || "",
      propertyName: c.propertyName || "",
      promoCode: c.promoCode || "",
      amount: round2(c.amount),
      accommodationBase: round2(c.accommodationBase),
      currency: c.currency || "USD",
      status: c.status,
      checkIn: c.checkIn,
      checkOut: c.checkOut,
      guestName: c.guestName || "",
      bookingStatus: c.bookingStatus,
    })),
  };
}

export function newPortalToken() {
  return crypto.randomBytes(24).toString("base64url");
}
