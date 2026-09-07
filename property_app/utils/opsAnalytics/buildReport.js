import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import HostApplication from "@/models/HostApplication";
import { getFoundingHostAnalytics } from "@/utils/foundingHost/stats";
import { isPaymentGatewayCheckoutEnabled } from "@/utils/bookings/paymentMode";
import { percentChange } from "@/utils/opsAnalytics/range";
import {
  BOOKING_LIVE,
  HOST_USER,
  NOT_TRAINING,
  NOT_TRAINING_USER,
  bookingEconomics,
  bookingStatusCounts,
  completedStayCount,
  countFlow,
  countStock,
  distinctPropertyOwners,
  geoHostCounts,
  geoPropertyCounts,
  geoReservationCounts,
  inactiveListingCount,
  liveListingCount,
  propertiesWithReservations,
  seriesBookingValue,
  seriesCount,
  seriesHostApprovals,
  trafficVisitorsInRange,
} from "@/utils/opsAnalytics/queries";

function kpi(current, previous, { compare, kind = "stock" } = {}) {
  return {
    current: Number(current) || 0,
    previous: compare ? Number(previous) || 0 : null,
    deltaPct: compare ? percentChange(current, previous) : null,
    kind,
  };
}

function moneyKpi(current, previous, compare) {
  return kpi(current, previous, { compare, kind: "money" });
}

function topPlaces(rows, valueKey, limit = 8) {
  const countries = new Map();
  const cities = [];
  for (const row of rows) {
    const country = String(row._id?.country ?? row._id ?? "").trim() || "Unknown";
    const city = String(row._id?.city ?? "").trim();
    const value = Number(row[valueKey] || row.properties || row.reservations || row.hosts) || 0;
    countries.set(country, (countries.get(country) || 0) + value);
    if (city) {
      cities.push({ country, city, value });
    }
  }
  return {
    countries: [...countries.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit),
    cities: cities
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map(({ country, city, value }) => ({
        name: `${city}, ${country === "Unknown" ? "" : country}`.replace(/, $/, ""),
        value,
      })),
  };
}

function rate(part, whole) {
  const w = Number(whole) || 0;
  if (w <= 0) return null;
  return Math.round(((Number(part) || 0) / w) * 1000) / 10;
}

function daysInRange(from, to) {
  return Math.max(1, (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export async function buildOpsAnalytics(range, now = new Date()) {
  const { from, to, previousFrom, previousTo, compare, granularity } = range;

  const [
    usersEnd,
    usersPrevEnd,
    usersNew,
    usersNewPrev,
    hostsEnd,
    hostsPrevEnd,
    hostsNew,
    hostsNewPrev,
    propertiesEnd,
    propertiesPrevEnd,
    propertiesNew,
    propertiesNewPrev,
    reservationsEnd,
    reservationsPrevEnd,
    reservationsNew,
    reservationsNewPrev,
    reservationStatus,
    reservationStatusPrev,
    economics,
    economicsPrev,
    completed,
    completedPrev,
    listingLive,
    listingInactive,
    hostsWithProperties,
    propertiesBooked,
    userSeries,
    hostSeries,
    propertySeries,
    bookingSeries,
    traffic,
    trafficPrev,
    founding,
    geoProps,
    geoReservations,
    geoHosts,
  ] = await Promise.all([
    countStock(User, NOT_TRAINING_USER, to),
    compare ? countStock(User, NOT_TRAINING_USER, previousTo) : 0,
    countFlow(User, NOT_TRAINING_USER, from, to),
    compare ? countFlow(User, NOT_TRAINING_USER, previousFrom, previousTo) : 0,
    countStock(User, { ...HOST_USER, ...NOT_TRAINING_USER }, to),
    compare ? countStock(User, { ...HOST_USER, ...NOT_TRAINING_USER }, previousTo) : 0,
    HostApplication.countDocuments({
      status: "approved",
      reviewedAt: { $gte: from, $lt: to },
    }),
    compare
      ? HostApplication.countDocuments({
          status: "approved",
          reviewedAt: { $gte: previousFrom, $lt: previousTo },
        })
      : 0,
    countStock(Property, {}, to),
    compare ? countStock(Property, {}, previousTo) : 0,
    countFlow(Property, {}, from, to),
    compare ? countFlow(Property, {}, previousFrom, previousTo) : 0,
    countStock(Booking, NOT_TRAINING, to),
    compare ? countStock(Booking, NOT_TRAINING, previousTo) : 0,
    countFlow(Booking, NOT_TRAINING, from, to),
    compare ? countFlow(Booking, NOT_TRAINING, previousFrom, previousTo) : 0,
    bookingStatusCounts(from, to),
    compare
      ? bookingStatusCounts(previousFrom, previousTo)
      : { pending: 0, confirmed: 0, cancelled: 0, total: 0 },
    bookingEconomics(from, to),
    compare
      ? bookingEconomics(previousFrom, previousTo)
      : {
          liveValue: 0,
          confirmedValue: 0,
          cancelledValue: 0,
          gatewayValue: 0,
          revenue: 0,
          waived: 0,
          foundingWaived: 0,
          commissionFreeCount: 0,
          confirmedCount: 0,
          currencies: [],
        },
    completedStayCount(from, to, now),
    compare ? completedStayCount(previousFrom, previousTo, now) : 0,
    liveListingCount(),
    inactiveListingCount(),
    distinctPropertyOwners(),
    propertiesWithReservations(),
    seriesCount(User, NOT_TRAINING_USER, from, to, granularity),
    seriesHostApprovals(from, to, granularity),
    seriesCount(Property, {}, from, to, granularity),
    seriesBookingValue(from, to, granularity),
    trafficVisitorsInRange(from, to),
    compare ? trafficVisitorsInRange(previousFrom, previousTo) : { visitors: 0, views: 0 },
    getFoundingHostAnalytics(now),
    geoPropertyCounts(),
    geoReservationCounts(from, to),
    geoHostCounts(),
  ]);

  const days = daysInRange(from, to);
  const avgReservationsPerDay =
    Math.round((reservationStatus.total / days) * 10) / 10;
  const avgBookingValue =
    reservationStatus.confirmed > 0
      ? Math.round((economics.confirmedValue / reservationStatus.confirmed) * 100) / 100
      : 0;
  const avgRevenuePerReservation =
    economics.confirmedCount > 0
      ? Math.round((economics.revenue / economics.confirmedCount) * 100) / 100
      : 0;
  const avgPropertiesPerHost =
    hostsEnd > 0 ? Math.round((propertiesEnd / hostsEnd) * 100) / 100 : 0;

  const funnel = {
    users: usersEnd,
    hosts: hostsEnd,
    hostsWithProperties,
    propertiesWithReservations: propertiesBooked,
    reservations: await Booking.countDocuments(BOOKING_LIVE),
  };

  const notes = {
    activeUsers:
      "Signed-in daily active users are not stored on accounts (no last-seen timestamp). The Site visitors figure is anonymous public-site traffic from TrafficDay, not registered-account activity.",
    completedStays:
      "Completed is derived: confirmed reservations whose check-out date has already passed. There is no separate completed status in the booking model.",
    bookingValue:
      isPaymentGatewayCheckoutEnabled()
        ? "Gross booking value is the stay total recorded on the reservation. Gateway value is the subset with paymentMode=gateway. Isisel revenue is recorded commission on confirmed reservations, not a bank settlement feed."
        : "Checkout is currently arranged with the host (no payment gateway). Booking value is the recorded stay total on Isisel reservations — not money processed by Isisel. Isisel revenue is commission recorded on confirmed reservations.",
    hostGrowth:
      "New hosts are counted from approved host applications (reviewedAt). Total hosts is verified users created before the end of the range.",
    currencies:
      economics.currencies.length > 1
        ? `Amounts are summed as stored and may mix currencies: ${economics.currencies.join(", ")}. Listing rates are USD; booking snapshots may still carry a display currency.`
        : "Amounts are summed from booking snapshots (typically USD listing rates).",
    userGeo:
      "Guest accounts do not store country. Host geography uses hostAddress.country when present. Property/reservation geography uses listing city and country only — never street addresses.",
    trainingStays:
      "Ops training stays (source ops_training) are excluded from these figures so host drills do not inflate traction.",
  };

  return {
    generatedAt: now.toISOString(),
    timezone: "UTC",
    range: {
      preset: range.preset,
      from: from.toISOString(),
      to: to.toISOString(),
      label: range.label,
      previousFrom: range.previousFrom?.toISOString() || null,
      previousTo: range.previousTo?.toISOString() || null,
      previousLabel: range.previousLabel,
      compare,
      granularity,
    },
    notes,
    kpis: {
      users: kpi(usersEnd, usersPrevEnd, { compare }),
      newUsers: kpi(usersNew, usersNewPrev, { compare, kind: "flow" }),
      hosts: kpi(hostsEnd, hostsPrevEnd, { compare }),
      newHosts: kpi(hostsNew, hostsNewPrev, { compare, kind: "flow" }),
      properties: kpi(propertiesEnd, propertiesPrevEnd, { compare }),
      reservations: kpi(reservationsEnd, reservationsPrevEnd, { compare }),
      newReservations: kpi(reservationsNew, reservationsNewPrev, {
        compare,
        kind: "flow",
      }),
      confirmedReservations: kpi(
        reservationStatus.confirmed,
        reservationStatusPrev.confirmed,
        { compare, kind: "flow" },
      ),
      cancelledReservations: kpi(
        reservationStatus.cancelled,
        reservationStatusPrev.cancelled,
        { compare, kind: "flow" },
      ),
      grossBookingValue: moneyKpi(economics.liveValue, economicsPrev.liveValue, compare),
      isiselRevenue: moneyKpi(economics.revenue, economicsPrev.revenue, compare),
      commissionWaived: moneyKpi(economics.waived, economicsPrev.waived, compare),
      siteVisitors: kpi(traffic.visitors, trafficPrev.visitors, {
        compare,
        kind: "flow",
      }),
    },
    users: {
      total: usersEnd,
      newInPeriod: usersNew,
      previousNew: compare ? usersNewPrev : null,
      growthPct: compare ? percentChange(usersNew, usersNewPrev) : null,
      series: userSeries,
    },
    hosts: {
      total: hostsEnd,
      newInPeriod: hostsNew,
      hostsWithProperties,
      avgPropertiesPerHost,
      growthPct: compare ? percentChange(hostsNew, hostsNewPrev) : null,
      series: hostSeries,
    },
    properties: {
      total: propertiesEnd,
      newInPeriod: propertiesNew,
      activeListings: listingLive,
      inactiveListings: listingInactive,
      avgPerHost: avgPropertiesPerHost,
      series: propertySeries,
    },
    reservations: {
      ...reservationStatus,
      createdInPeriod: reservationsNew,
      completed,
      confirmationRate: rate(reservationStatus.confirmed, reservationStatus.total),
      cancellationRate: rate(reservationStatus.cancelled, reservationStatus.total),
      avgPerDay: avgReservationsPerDay,
      series: bookingSeries.reservations,
    },
    economics: {
      ...economics,
      avgBookingValue,
      avgRevenuePerReservation,
      gatewayEnabled: isPaymentGatewayCheckoutEnabled(),
      seriesValue: bookingSeries.bookingValue,
      seriesRevenue: bookingSeries.revenue,
    },
    founding: {
      claimed: founding.spotsClaimed,
      limit: founding.totalSpots,
      remaining: founding.spotsRemaining,
      active: founding.activeFoundingHosts,
      expired: founding.expiredFoundingHosts,
      revoked: founding.revokedFoundingHosts,
      bookingsGenerated: founding.bookingsGenerated,
      bookingValue: founding.grossBookingValue,
      commissionWaived: founding.commissionWaived,
    },
    activity: {
      newUsers: usersNew,
      newProperties: propertiesNew,
      newReservations: reservationsNew,
      siteVisitors: traffic.visitors,
      siteViews: traffic.views,
      trafficCoverage: traffic.daysTracked,
      trafficDays: traffic.daysInRange,
    },
    geo: {
      properties: topPlaces(geoProps, "properties"),
      reservations: topPlaces(geoReservations, "reservations"),
      hosts: {
        countries: geoHosts
          .map((row) => ({
            name: String(row._id || "").trim() || "Unknown",
            value: Number(row.hosts) || 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
        cities: [],
      },
    },
    funnel: {
      ...funnel,
      conversions: {
        userToHost: rate(funnel.hosts, funnel.users),
        hostToListed: rate(funnel.hostsWithProperties, funnel.hosts),
        listedToBookedProperty: rate(
          funnel.propertiesWithReservations,
          propertiesEnd,
        ),
      },
    },
  };
}
