import mongoose from "mongoose";
import PlatformSettings, {
  FOUNDING_HOST_PROGRAM_SETTINGS_ID,
} from "@/models/PlatformSettings";
import User from "@/models/User";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";
import { writeFoundingHostAudit } from "@/utils/foundingHost/audit";
import { sendFoundingHostWelcomeEmail } from "@/utils/email/sendFoundingHostEmail";
import Property from "@/models/Property";
import {
  AUDIT_ACTIONS,
  FOUNDING_HOST_STATUS,
  GRANT_REASON,
  addYearsUtc,
  shouldAllocateFoundingHostOnListingApproval,
} from "@/utils/foundingHost/logic";

const SYSTEM_ACTOR = Object.freeze({
  id: "system",
  email: null,
  name: "System",
});

function noNumberFilter() {
  return {
    $or: [
      { "foundingHost.number": { $exists: false } },
      { "foundingHost.number": null },
    ],
  };
}

/**
 * Atomically claim the next Founding Host number.
 * Mongo serializes the document update so two concurrent approvals cannot
 * both take the last remaining spot.
 */
async function claimNextNumber({ requireActive, overrideLimit }) {
  await getOrCreateProgramSettings();

  const filter = { _id: FOUNDING_HOST_PROGRAM_SETTINGS_ID };
  if (requireActive) {
    filter.programStatus = "active";
  }
  if (!overrideLimit) {
    filter.$expr = { $lt: ["$claimedCount", "$foundingHostLimit"] };
  }

  const claimed = await PlatformSettings.findOneAndUpdate(
    filter,
    { $inc: { claimedCount: 1 } },
    { new: true },
  );

  if (!claimed) return null;
  return {
    number: claimed.claimedCount,
    settings: claimed,
  };
}

async function rollbackClaim() {
  await PlatformSettings.updateOne(
    {
      _id: FOUNDING_HOST_PROGRAM_SETTINGS_ID,
      claimedCount: { $gt: 0 },
    },
    { $inc: { claimedCount: -1 } },
  );
}

/**
 * Assign Founding Host status to a user if a number can be claimed.
 * Does not decrement claimedCount on later revoke — numbers are never reused.
 */
export async function tryAllocateFoundingHost({
  userId,
  grantedBy = SYSTEM_ACTOR,
  grantReason = GRANT_REASON.AUTOMATIC_ELIGIBILITY,
  requireActive = true,
  overrideLimit = false,
  notes = null,
  notify = true,
} = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { allocated: false, reason: "invalid_user" };
  }

  const oid = new mongoose.Types.ObjectId(String(userId));
  const existing = await User.findById(oid)
    .select("foundingHost email username")
    .lean();

  if (!existing) {
    return { allocated: false, reason: "user_not_found" };
  }

  if (existing.foundingHost?.number) {
    return {
      allocated: false,
      reason: "already_granted",
      number: existing.foundingHost.number,
    };
  }

  const claimed = await claimNextNumber({ requireActive, overrideLimit });
  if (!claimed) {
    const settings = await getOrCreateProgramSettings();
    if (requireActive && settings.programStatus !== "active") {
      return { allocated: false, reason: "paused" };
    }
    return { allocated: false, reason: "full" };
  }

  const now = new Date();
  const expiresAt = addYearsUtc(
    now,
    claimed.settings.foundingHostDurationYears,
  );

  const grantedByValue =
    grantedBy?.id &&
    grantedBy.id !== "system" &&
    mongoose.Types.ObjectId.isValid(String(grantedBy.id))
      ? new mongoose.Types.ObjectId(String(grantedBy.id))
      : grantedBy?.id || "system";

  const updated = await User.findOneAndUpdate(
    { _id: oid, ...noNumberFilter() },
    {
      $set: {
        "foundingHost.isFoundingHost": true,
        "foundingHost.number": claimed.number,
        "foundingHost.grantedAt": now,
        "foundingHost.expiresAt": expiresAt,
        "foundingHost.grantedBy": grantedByValue,
        "foundingHost.grantReason": grantReason,
        "foundingHost.status": FOUNDING_HOST_STATUS.ACTIVE,
      },
    },
    { new: true },
  );

  if (!updated) {
    await rollbackClaim();
    return { allocated: false, reason: "already_granted" };
  }

  await writeFoundingHostAudit({
    hostId: oid,
    action: AUDIT_ACTIONS.FOUNDING_HOST_GRANTED,
    previousStatus: "none",
    newStatus: FOUNDING_HOST_STATUS.ACTIVE,
    previousExpiration: null,
    newExpiration: expiresAt,
    actor: grantedBy,
    reason: grantReason,
    notes,
    meta: {
      number: claimed.number,
      automatic: grantReason === GRANT_REASON.AUTOMATIC_ELIGIBILITY,
      overrideLimit: Boolean(overrideLimit),
    },
  });

  if (notify) {
    try {
      await sendFoundingHostWelcomeEmail({
        hostEmail: updated.email,
        hostName: updated.username,
        number: claimed.number,
        expiresAt,
        commissionRate: claimed.settings.foundingHostCommissionRate,
      });
    } catch (error) {
      console.error("[founding host] welcome email failed:", error);
    }
  }

  return {
    allocated: true,
    number: claimed.number,
    grantedAt: now,
    expiresAt,
    user: updated,
  };
}

/**
 * Award Founding Host only when this listing is the host's first approval.
 * Safe to call after the listing has already been set to approved.
 */
export async function tryAllocateFoundingHostOnFirstListingApproval({
  ownerId,
  listingId,
  previousStatus,
  grantedBy = SYSTEM_ACTOR,
} = {}) {
  if (
    !shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus,
      otherApprovedListingCount: 0,
    })
  ) {
    return { allocated: false, reason: "not_new_approval" };
  }

  if (!ownerId || !mongoose.Types.ObjectId.isValid(String(ownerId))) {
    return { allocated: false, reason: "invalid_owner" };
  }

  const ownerOid = new mongoose.Types.ObjectId(String(ownerId));
  const listingFilter = {
    owner: ownerOid,
    status: "approved",
  };
  if (listingId && mongoose.Types.ObjectId.isValid(String(listingId))) {
    listingFilter._id = {
      $ne: new mongoose.Types.ObjectId(String(listingId)),
    };
  }

  const otherApprovedListingCount = await Property.countDocuments(listingFilter);

  if (
    !shouldAllocateFoundingHostOnListingApproval({
      incomingStatus: "approved",
      previousStatus,
      otherApprovedListingCount,
    })
  ) {
    return { allocated: false, reason: "not_first_listing" };
  }

  return tryAllocateFoundingHost({
    userId: ownerId,
    grantedBy,
    notify: true,
  });
}
