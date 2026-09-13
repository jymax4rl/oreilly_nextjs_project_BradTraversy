import User from "@/models/User";
import { PLATFORM_COMMISSION_RATE } from "@/utils/propertyRates";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";
import { resolveHostCommission } from "@/utils/foundingHost/logic";

const HOST_COMMISSION_FIELDS =
  "foundingHost commissionOverride username email";

export async function resolveCommissionForHost(host, { now = new Date() } = {}) {
  const settings = await getOrCreateProgramSettings();
  return {
    ...resolveHostCommission({
      foundingHost: host?.foundingHost,
      commissionOverride: host?.commissionOverride,
      programCommissionRate: settings.foundingHostCommissionRate,
      standardRate: PLATFORM_COMMISSION_RATE,
      now,
    }),
    settings,
  };
}

export async function resolveCommissionForHostId(hostId, options) {
  if (!hostId) {
    return resolveCommissionForHost(null, options);
  }
  const host = await User.findById(hostId).select(HOST_COMMISSION_FIELDS).lean();
  return resolveCommissionForHost(host, options);
}

export async function resolveCommissionForProperty(property, options) {
  const ownerId = property?.owner;
  return resolveCommissionForHostId(ownerId, options);
}
