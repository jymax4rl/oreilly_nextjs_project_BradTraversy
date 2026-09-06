import { Schema, models, model } from "mongoose";
import { PROGRAM_DEFAULTS, PROGRAM_STATUS } from "@/utils/foundingHost/logic";

export const FOUNDING_HOST_PROGRAM_SETTINGS_ID = "founding_host_program";

const PlatformSettingsSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    foundingHostLimit: {
      type: Number,
      default: PROGRAM_DEFAULTS.foundingHostLimit,
      min: 1,
    },
    foundingHostCommissionRate: {
      type: Number,
      default: PROGRAM_DEFAULTS.foundingHostCommissionRate,
      min: 0,
      max: 1,
    },
    foundingHostDurationYears: {
      type: Number,
      default: PROGRAM_DEFAULTS.foundingHostDurationYears,
      min: 1,
    },
    programStatus: {
      type: String,
      enum: [PROGRAM_STATUS.ACTIVE, PROGRAM_STATUS.PAUSED],
      default: PROGRAM_STATUS.ACTIVE,
    },
    /**
     * Monotonic counter of assigned Founding Host numbers.
     * Never decremented on revoke — numbers are not reused.
     */
    claimedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, collection: "PlatformSettings" },
);

const PlatformSettings =
  models.PlatformSettings || model("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;
