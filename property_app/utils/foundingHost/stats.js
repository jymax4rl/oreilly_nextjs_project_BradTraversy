import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import { PLATFORM_COMMISSION_RATE } from "@/utils/propertyRates";
import { getOrCreateProgramSettings, serializeProgramSettings } from "@/utils/foundingHost/settings";
import { foundingHostDisplayStatus, DISPLAY_STATUS } from "@/utils/foundingHost/logic";

export async function getFoundingHostDashboardStats(now = new Date()) {
  const settings = await getOrCreateProgramSettings();
  const serialized = serializeProgramSettings(settings);

  const hosts = await User.find({ "foundingHost.number": { $ne: null } })
    .select("foundingHost")
    .lean();

  let active = 0;
  let expired = 0;
  let revoked = 0;
  for (const host of hosts) {
    const status = foundingHostDisplayStatus(host.foundingHost, now);
    if (status === DISPLAY_STATUS.ACTIVE) active += 1;
    else if (status === DISPLAY_STATUS.EXPIRED) expired += 1;
    else if (status === DISPLAY_STATUS.REVOKED) revoked += 1;
  }

  return {
    ...serialized,
    totalSpots: serialized.foundingHostLimit,
    spotsClaimed: serialized.claimedCount,
    activeFoundingHosts: active,
    expiredFoundingHosts: expired,
    revokedFoundingHosts: revoked,
  };
}

export async function getFoundingHostAnalytics(now = new Date()) {
  const dashboard = await getFoundingHostDashboardStats(now);

  const foundingHosts = await User.find({
    "foundingHost.number": { $ne: null },
    "foundingHost.status": { $ne: "revoked" },
  })
    .select("_id")
    .lean();

  const hostIds = foundingHosts.map((h) => String(h._id));

  if (hostIds.length === 0) {
    return {
      ...dashboard,
      bookingsGenerated: 0,
      grossBookingValue: 0,
      commissionWaived: 0,
    };
  }

  const properties = await Property.find({ owner: { $in: hostIds } })
    .select("_id")
    .lean();
  const propertyIds = properties.map((p) => p._id);

  if (propertyIds.length === 0) {
    return {
      ...dashboard,
      bookingsGenerated: 0,
      grossBookingValue: 0,
      commissionWaived: 0,
    };
  }

  const bookings = await Booking.find({
    propertyId: { $in: propertyIds },
    status: { $in: ["pending", "confirmed"] },
    source: { $ne: "ops_training" },
  })
    .select("amount pricingSnapshot")
    .lean();

  let grossBookingValue = 0;
  let commissionWaived = 0;
  for (const booking of bookings) {
    const total =
      booking.pricingSnapshot?.total ??
      booking.amount ??
      0;
    grossBookingValue += Number(total) || 0;
    if (booking.pricingSnapshot?.commissionWaived) {
      const base = Number(booking.pricingSnapshot.accommodationBase) || 0;
      const applied = Number(booking.pricingSnapshot.commissionRateApplied);
      // Waived amount is what standard 7% would have been, minus what was charged.
      const charged = Number(booking.pricingSnapshot.commissionAmount) || 0;
      const wouldHaveBeen =
        Number.isFinite(applied) && applied === 0
          ? Math.round(base * PLATFORM_COMMISSION_RATE * 100) / 100
          : Math.max(
              0,
              Math.round(base * PLATFORM_COMMISSION_RATE * 100) / 100 - charged,
            );
      commissionWaived += wouldHaveBeen;
    }
  }

  return {
    ...dashboard,
    bookingsGenerated: bookings.length,
    grossBookingValue: Math.round(grossBookingValue * 100) / 100,
    commissionWaived: Math.round(commissionWaived * 100) / 100,
  };
}
