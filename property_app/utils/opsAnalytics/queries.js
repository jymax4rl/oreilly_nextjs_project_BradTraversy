import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import HostApplication from "@/models/HostApplication";
import TrafficDay from "@/models/TrafficDay";
import { publicListingQuery } from "@/utils/listingApproval";
import { utcDayKey } from "@/utils/metrics/recordTraffic";
import { addUtcDays, fillTimeBuckets, isoDay, startOfUtcDay } from "@/utils/opsAnalytics/range";
import { WAIVER_REASON } from "@/utils/foundingHost/logic";
import { PLATFORM_COMMISSION_RATE } from "@/utils/propertyRates";

const HOST_USER = { hostStatus: "verified" };
const NOT_TRAINING_USER = { isTrainingGuest: { $ne: true } };
const BOOKING_LIVE = {
  status: { $in: ["pending", "confirmed"] },
  source: { $ne: "ops_training" },
};
const NOT_TRAINING = { source: { $ne: "ops_training" } };

function createdIn(from, to) {
  return { createdAt: { $gte: from, $lt: to } };
}

function createdBefore(at) {
  return {
    $or: [{ createdAt: { $lt: at } }, { createdAt: null }],
  };
}

const bookingValueExpr = {
  $ifNull: ["$pricingSnapshot.total", { $ifNull: ["$amount", 0] }],
};

const commissionChargedExpr = {
  $ifNull: ["$pricingSnapshot.commissionAmount", 0],
};

const waivedExpr = {
  $cond: [
    { $eq: ["$pricingSnapshot.commissionWaived", true] },
    {
      $max: [
        0,
        {
          $subtract: [
            {
              $multiply: [
                { $ifNull: ["$pricingSnapshot.accommodationBase", 0] },
                PLATFORM_COMMISSION_RATE,
              ],
            },
            commissionChargedExpr,
          ],
        },
      ],
    },
    0,
  ],
};

function locField(path) {
  return {
    $let: {
      vars: {
        raw: {
          $convert: {
            input: path,
            to: "string",
            onError: "",
            onNull: "",
          },
        },
      },
      in: { $trim: { input: { $ifNull: ["$$raw", ""] } } },
    },
  };
}

function alignTrunc(date, unit) {
  const d = startOfUtcDay(date);
  if (unit === "day") return d;
  if (unit === "week") {
    const day = d.getUTCDay();
    const offset = day === 0 ? 6 : day - 1;
    return addUtcDays(d, -offset);
  }
  const m = new Date(d);
  m.setUTCDate(1);
  return m;
}

export async function countStock(Model, match, at) {
  return Model.countDocuments({ ...match, ...createdBefore(at) });
}

export async function countFlow(Model, match, from, to) {
  return Model.countDocuments({ ...match, ...createdIn(from, to) });
}

export async function seriesCount(Model, match, from, to, unit) {
  const alignedFrom = alignTrunc(from, unit);
  const [baseline, rows] = await Promise.all([
    countStock(Model, match, from),
    Model.aggregate([
      { $match: { ...match, createdAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit,
              timezone: "UTC",
              ...(unit === "week" ? { startOfWeek: "monday" } : {}),
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const flow = fillTimeBuckets(rows, alignedFrom, to, unit, "count");
  let running = baseline;
  return flow.map((point) => {
    running += point.value;
    return { t: point.t, value: running, added: point.value };
  });
}

export async function seriesHostApprovals(from, to, unit) {
  const alignedFrom = alignTrunc(from, unit);
  const rows = await HostApplication.aggregate([
    {
      $match: {
        status: "approved",
        reviewedAt: { $gte: from, $lt: to },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$reviewedAt",
            unit,
            timezone: "UTC",
            ...(unit === "week" ? { startOfWeek: "monday" } : {}),
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return fillTimeBuckets(rows, alignedFrom, to, unit, "count");
}

export async function bookingStatusCounts(from, to) {
  const rows = await Booking.aggregate([
    { $match: { ...createdIn(from, to), ...NOT_TRAINING } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const out = { pending: 0, confirmed: 0, cancelled: 0 };
  for (const row of rows) {
    if (row._id && out[row._id] != null) out[row._id] = row.count;
  }
  out.total = out.pending + out.confirmed + out.cancelled;
  return out;
}

export async function bookingEconomics(from, to) {
  const [row] = await Booking.aggregate([
    { $match: { ...createdIn(from, to), ...NOT_TRAINING } },
    {
      $group: {
        _id: null,
        allValue: { $sum: bookingValueExpr },
        liveValue: {
          $sum: {
            $cond: [{ $in: ["$status", ["pending", "confirmed"]] }, bookingValueExpr, 0],
          },
        },
        confirmedValue: {
          $sum: {
            $cond: [{ $eq: ["$status", "confirmed"] }, bookingValueExpr, 0],
          },
        },
        cancelledValue: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, bookingValueExpr, 0],
          },
        },
        gatewayValue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "confirmed"] },
                  { $eq: ["$paymentMode", "gateway"] },
                ],
              },
              bookingValueExpr,
              0,
            ],
          },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "confirmed"] }, commissionChargedExpr, 0],
          },
        },
        waived: {
          $sum: {
            $cond: [
              { $in: ["$status", ["pending", "confirmed"]] },
              waivedExpr,
              0,
            ],
          },
        },
        foundingWaived: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["pending", "confirmed"]] },
                  {
                    $eq: [
                      "$pricingSnapshot.commissionWaiverReason",
                      WAIVER_REASON.FOUNDING_HOST,
                    ],
                  },
                ],
              },
              waivedExpr,
              0,
            ],
          },
        },
        commissionFreeCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["pending", "confirmed"]] },
                  { $eq: ["$pricingSnapshot.commissionWaived", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        confirmedCount: {
          $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
        },
        currencies: { $addToSet: { $ifNull: ["$pricingSnapshot.currency", "$currency"] } },
      },
    },
  ]);

  return {
    allValue: roundMoney(row?.allValue),
    liveValue: roundMoney(row?.liveValue),
    confirmedValue: roundMoney(row?.confirmedValue),
    cancelledValue: roundMoney(row?.cancelledValue),
    gatewayValue: roundMoney(row?.gatewayValue),
    revenue: roundMoney(row?.revenue),
    waived: roundMoney(row?.waived),
    foundingWaived: roundMoney(row?.foundingWaived),
    commissionFreeCount: Number(row?.commissionFreeCount) || 0,
    confirmedCount: Number(row?.confirmedCount) || 0,
    currencies: (row?.currencies || []).filter(Boolean),
  };
}

export async function seriesBookingValue(from, to, unit) {
  const alignedFrom = alignTrunc(from, unit);
  const rows = await Booking.aggregate([
    {
      $match: {
        ...BOOKING_LIVE,
        createdAt: { $gte: from, $lt: to },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit,
            timezone: "UTC",
            ...(unit === "week" ? { startOfWeek: "monday" } : {}),
          },
        },
        count: { $sum: 1 },
        value: { $sum: bookingValueExpr },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "confirmed"] }, commissionChargedExpr, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return {
    reservations: fillTimeBuckets(rows, alignedFrom, to, unit, "count"),
    bookingValue: fillTimeBuckets(rows, alignedFrom, to, unit, "value"),
    revenue: fillTimeBuckets(rows, alignedFrom, to, unit, "revenue"),
  };
}

export async function completedStayCount(from, to, now = new Date()) {
  const today = isoDay(now);
  return Booking.countDocuments({
    ...NOT_TRAINING,
    status: "confirmed",
    checkOut: { $gte: isoDay(from), $lt: isoDay(to), $lte: today },
  });
}

export async function distinctPropertyOwners() {
  const owners = await Property.distinct("owner", {
    owner: { $nin: [null, ""] },
  });
  return owners.filter(Boolean).length;
}

export async function propertiesWithReservations() {
  const ids = await Booking.distinct("propertyId", BOOKING_LIVE);
  return ids.filter(Boolean).length;
}

export async function geoPropertyCounts() {
  const rows = await Property.aggregate([
    {
      $group: {
        _id: {
          country: locField("$location.country"),
          city: locField("$location.city"),
        },
        properties: { $sum: 1 },
      },
    },
  ]);
  return rows;
}

export async function geoReservationCounts(from, to) {
  return Booking.aggregate([
    { $match: { ...createdIn(from, to), ...BOOKING_LIVE } },
    {
      $lookup: {
        from: "Properties",
        localField: "propertyId",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          country: locField("$property.location.country"),
          city: locField("$property.location.city"),
        },
        reservations: { $sum: 1 },
      },
    },
  ]);
}

export async function geoHostCounts() {
  return User.aggregate([
    { $match: HOST_USER },
    {
      $group: {
        _id: locField("$hostAddress.country"),
        hosts: { $sum: 1 },
      },
    },
  ]);
}

export async function trafficVisitorsInRange(from, to) {
  const startKey = utcDayKey(from);
  const endKey = utcDayKey(to);
  const daysInRange = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const docs = await TrafficDay.find({
    _id: { $gte: startKey, $lt: endKey },
  })
    .select("views visitors")
    .lean();
  return {
    visitors: docs.reduce((s, d) => s + (Number(d.visitors) || 0), 0),
    views: docs.reduce((s, d) => s + (Number(d.views) || 0), 0),
    daysTracked: docs.length,
    daysInRange,
  };
}

export async function liveListingCount() {
  return Property.countDocuments(publicListingQuery());
}

export async function inactiveListingCount() {
  const total = await Property.countDocuments({});
  const live = await liveListingCount();
  return Math.max(0, total - live);
}

export function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export { HOST_USER, BOOKING_LIVE, NOT_TRAINING, NOT_TRAINING_USER };
