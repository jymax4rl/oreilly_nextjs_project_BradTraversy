import mongoose from "mongoose";
import CleaningJob from "@/models/CleaningJob";
import CleanerProfile from "@/models/CleanerProfile";
import HostCleanerLink from "@/models/HostCleanerLink";
import Property from "@/models/Property";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import {
  CLEANING_TYPES,
  DEFAULT_CHECKLIST,
} from "@/utils/cleaners/constants";
import {
  assertHostOwnsProperty,
  formatPropertyAddress,
  timesOverlap,
} from "@/utils/cleaners/access";
import { notifyCleaning } from "@/utils/cleaners/notify";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";

const ACTIVE_SCHEDULE_STATUSES = [
  "requested",
  "accepted",
  "scheduled",
  "en_route",
  "in_progress",
];

export function addMinutes(hhmm, minutes) {
  const [h, m] = String(hhmm || "11:00").split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + Number(minutes || 0);
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function loadJobForHost(jobId, hostId, extra = {}) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return CleaningJob.findOne({ _id: jobId, hostId })
    .populate("propertyId", "name type location checkOutTime checkInTime beds baths")
    .populate("cleanerId", "username image email")
    .populate("requestedCleanerId", "username image email")
    .populate("reservationId", extra.forCleaner ? "checkOut" : "checkOut guestName")
    .lean();
}

export async function loadJobForCleaner(jobId, cleanerId) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return CleaningJob.findOne({
    _id: jobId,
    $or: [{ cleanerId }, { requestedCleanerId: cleanerId }],
  })
    .populate("propertyId", "name type location checkOutTime checkInTime beds baths")
    .populate("cleanerId", "username image")
    .populate("reservationId", "checkOut")
    .lean();
}

export async function cleanerHasConflict({
  cleanerId,
  scheduledDate,
  scheduledStartTime,
  scheduledEndTime,
  ignoreJobId,
}) {
  if (!cleanerId || !scheduledDate) return false;
  const jobs = await CleaningJob.find({
    cleanerId,
    scheduledDate,
    status: { $in: ACTIVE_SCHEDULE_STATUSES },
    ...(ignoreJobId ? { _id: { $ne: ignoreJobId } } : {}),
  })
    .select("scheduledStartTime scheduledEndTime")
    .lean();
  return jobs.some((job) =>
    timesOverlap(
      scheduledStartTime,
      scheduledEndTime,
      job.scheduledStartTime,
      job.scheduledEndTime,
    ),
  );
}

export async function createCleaningJob({
  hostId,
  propertyId,
  scheduledDate,
  scheduledStartTime,
  scheduledEndTime,
  estimatedDuration,
  cleaningType,
  hostNotes,
  cleanerId,
  requestCleaner,
  reservationId,
  agreedPrice,
  currency,
}) {
  const owned = await assertHostOwnsProperty(propertyId, hostId);
  if (!owned.ok) return owned;

  const type = CLEANING_TYPES.includes(cleaningType) ? cleaningType : "regular";
  const settings = await PropertyCleaningSettings.findOne({
    propertyId,
  }).lean();
  const duration = Number(estimatedDuration) || settings?.estimatedMinutes || 150;
  const start = scheduledStartTime || owned.property.checkOutTime || "11:00";
  const end = scheduledEndTime || addMinutes(start, duration);
  const checklistSource = settings?.checklist?.length
    ? settings.checklist
    : DEFAULT_CHECKLIST;

  let status = "pending";
  let assigned = null;
  let requested = null;

  if (cleanerId) {
    const link = await HostCleanerLink.findOne({
      hostId,
      cleanerId,
      status: "active",
    }).lean();
    if (!link) {
      return { ok: false, status: 400, error: "Cleaner is not on your trusted list" };
    }
    const conflict = await cleanerHasConflict({
      cleanerId,
      scheduledDate,
      scheduledStartTime: start,
      scheduledEndTime: end,
    });
    if (conflict) {
      return { ok: false, status: 409, error: "This cleaner already has a job in that window" };
    }
    if (requestCleaner) {
      status = "requested";
      requested = cleanerId;
    } else {
      status = "scheduled";
      assigned = cleanerId;
    }
  }

  const job = await CleaningJob.create({
    hostId: String(hostId),
    propertyId,
    reservationId: reservationId || undefined,
    cleanerId: assigned,
    requestedCleanerId: requested,
    propertyName: owned.property.name || "",
    propertyAddress: formatPropertyAddress(owned.property),
    checkoutTime: owned.property.checkOutTime || "11:00",
    scheduledDate,
    scheduledStartTime: start,
    scheduledEndTime: end,
    estimatedDuration: duration,
    status,
    cleaningType: type,
    checklist: checklistSource.map((item, index) => ({
      key: item.key || `item-${index}`,
      label: item.label,
      done: false,
    })),
    propertyInstructions: settings?.instructions || "",
    hostNotes: hostNotes || "",
    agreedPrice: agreedPrice != null ? Number(agreedPrice) : null,
    currency: currency || "GMD",
  });

  const notifyUser = requested || assigned;
  if (notifyUser) {
    await notifyCleaning({
      userId: notifyUser,
      jobId: job._id,
      kind: requested ? "cleaning_request" : "cleaning_scheduled",
      title: requested ? "New cleaning request" : "New cleaning assigned",
      body: `${owned.property.name} · ${scheduledDate} · ${start}–${end}`,
    });
  }

  return { ok: true, job: job.toObject() };
}

export async function acceptCleaningJob(jobId, cleanerId) {
  const job = await CleaningJob.findOne({
    _id: jobId,
    requestedCleanerId: cleanerId,
    status: "requested",
  });
  if (!job) {
    return { ok: false, status: 404, error: "Request not found" };
  }
  const conflict = await cleanerHasConflict({
    cleanerId,
    scheduledDate: job.scheduledDate,
    scheduledStartTime: job.scheduledStartTime,
    scheduledEndTime: job.scheduledEndTime,
    ignoreJobId: job._id,
  });
  if (conflict) {
    return { ok: false, status: 409, error: "This overlaps another cleaning" };
  }
  job.cleanerId = cleanerId;
  job.status = "accepted";
  await job.save();
  await notifyCleaning({
    userId: job.hostId,
    jobId: job._id,
    kind: "cleaning_accepted",
    title: "Cleaning request accepted",
    body: `${job.propertyName} · ${job.scheduledDate}`,
  });
  return { ok: true, job: job.toObject() };
}

export async function declineCleaningJob(jobId, cleanerId) {
  const job = await CleaningJob.findOne({
    _id: jobId,
    requestedCleanerId: cleanerId,
    status: "requested",
  });
  if (!job) {
    return { ok: false, status: 404, error: "Request not found" };
  }
  job.requestedCleanerId = null;
  job.status = "pending";
  await job.save();
  await notifyCleaning({
    userId: job.hostId,
    jobId: job._id,
    kind: "cleaning_declined",
    title: "Cleaner declined a request",
    body: `${job.propertyName} · ${job.scheduledDate}`,
  });
  return { ok: true, job: job.toObject() };
}

export async function startCleaningJob(jobId, cleanerId) {
  const job = await CleaningJob.findOne({
    _id: jobId,
    cleanerId,
    status: { $in: ["accepted", "scheduled", "en_route"] },
  });
  if (!job) {
    return { ok: false, status: 404, error: "Cleaning not ready to start" };
  }
  job.status = "in_progress";
  job.startedAt = new Date();
  await job.save();
  await notifyCleaning({
    userId: job.hostId,
    jobId: job._id,
    kind: "cleaning_started",
    title: "Cleaning started",
    body: job.propertyName,
  });
  return { ok: true, job: job.toObject() };
}

export async function completeCleaningJob(jobId, cleanerId, { cleanerNotes } = {}) {
  const job = await CleaningJob.findOne({
    _id: jobId,
    cleanerId,
    status: { $in: ["in_progress", "issue_reported"] },
  });
  if (!job) {
    return { ok: false, status: 404, error: "Cleaning is not in progress" };
  }
  if (cleanerNotes != null) job.cleanerNotes = String(cleanerNotes).slice(0, 4000);
  job.status = job.issueReports?.length ? "issue_reported" : "completed";
  job.completionTimestamp = new Date();
  await job.save();

  await CleanerProfile.updateOne(
    { userId: cleanerId },
    { $inc: { completedCount: 1 } },
  );
  await HostCleanerLink.updateOne(
    { hostId: job.hostId, cleanerId },
    { $set: { lastJobAt: new Date() }, $inc: { completedCleanings: 1 } },
  );
  await notifyCleaning({
    userId: job.hostId,
    jobId: job._id,
    kind: "cleaning_completed",
    title: "Cleaning completed",
    body: `${job.propertyName} · report ready`,
  });
  return { ok: true, job: job.toObject() };
}

export function toPublicJob(job, { forCleaner = false } = {}) {
  return serializeCleaningJob(job, { forCleaner });
}

export async function getOrCreatePropertySettings(propertyId, hostId) {
  const owned = await assertHostOwnsProperty(propertyId, hostId);
  if (!owned.ok) return owned;
  let settings = await PropertyCleaningSettings.findOne({ propertyId }).lean();
  if (!settings) {
    const created = await PropertyCleaningSettings.create({
      propertyId,
      hostId: String(hostId),
    });
    settings = created.toObject();
  }
  return { ok: true, settings, property: owned.property };
}
