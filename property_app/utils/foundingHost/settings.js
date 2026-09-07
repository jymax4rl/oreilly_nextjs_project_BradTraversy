import PlatformSettings, {
  FOUNDING_HOST_PROGRAM_SETTINGS_ID,
} from "@/models/PlatformSettings";
import { PROGRAM_DEFAULTS } from "@/utils/foundingHost/logic";

export async function getOrCreateProgramSettings() {
  const existing = await PlatformSettings.findById(
    FOUNDING_HOST_PROGRAM_SETTINGS_ID,
  );
  if (existing) return existing;

  try {
    return await PlatformSettings.create({
      _id: FOUNDING_HOST_PROGRAM_SETTINGS_ID,
      foundingHostLimit: PROGRAM_DEFAULTS.foundingHostLimit,
      foundingHostCommissionRate: PROGRAM_DEFAULTS.foundingHostCommissionRate,
      foundingHostDurationYears: PROGRAM_DEFAULTS.foundingHostDurationYears,
      programStatus: PROGRAM_DEFAULTS.programStatus,
      claimedCount: 0,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return PlatformSettings.findById(FOUNDING_HOST_PROGRAM_SETTINGS_ID);
    }
    throw error;
  }
}

export function serializeProgramSettings(doc) {
  if (!doc) return null;
  const claimedCount = Number(doc.claimedCount) || 0;
  const foundingHostLimit =
    Number(doc.foundingHostLimit) || PROGRAM_DEFAULTS.foundingHostLimit;
  return {
    foundingHostLimit,
    foundingHostCommissionRate:
      doc.foundingHostCommissionRate == null
        ? PROGRAM_DEFAULTS.foundingHostCommissionRate
        : Number(doc.foundingHostCommissionRate),
    foundingHostDurationYears:
      Number(doc.foundingHostDurationYears) ||
      PROGRAM_DEFAULTS.foundingHostDurationYears,
    programStatus: doc.programStatus || PROGRAM_DEFAULTS.programStatus,
    claimedCount,
    spotsRemaining: Math.max(0, foundingHostLimit - claimedCount),
    updatedAt: doc.updatedAt || null,
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null,
  };
}
