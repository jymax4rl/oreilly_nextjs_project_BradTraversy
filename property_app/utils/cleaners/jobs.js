import mongoose from "mongoose";
import CleaningJob from "@/models/CleaningJob";
import CleanerProfile from "@/models/CleanerProfile";
import HostCleanerLink from "@/models/HostCleanerLink";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import {
  CLEANING_TYPES,
  DEFAULT_CHECKLIST,
} from "@/utils/cleaners/constants";
import {
  addMinutes,
  assertHostOwnsProperty,
  formatPropertyAddress,
  timesOverlap,
} from "@/utils/cleaners/access";
import { notifyCleaning } from "@/utils/cleaners/notify";
import { serializeCleaningJob } from "@/utils/cleaners/serialize";
import { planCleaningWindow } from "@/utils/cleaners/schedule";
import { localTodayYmd, addDaysYmd } from "@/utils/host/reservationsCalendar";
import { notifyCleanerNewJob } from "@/utils/push/webPush";

const ACTIVE_SCHEDULE_STATUSES = [
  "requested",
  "accepted",
  "scheduled",
  "en_route",
  "in_progress",
];

export { addMinutes };

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

export async function findAssignedCleaner(hostId, propertyId) {
  const link = await HostCleanerLink.findOne({
    hostId,
    status: "active",
    assignedPropertyIds: propertyId,
  }).lean();
  return link?.cleanerId ? String(link.cleanerId) : null;
}

export async function nextStayAfter(propertyId, checkOutYmd) {
  const Booking = (await import("@/models/Booking")).default;
  return Booking.findOne({
    propertyId,
    status: { $in: ["pending", "confirmed"] },
    listed: { $ne: false },
    checkIn: { $gte: checkOutYmd },
  })
    .select("checkIn checkOut")
    .sort({ checkIn: 1 })
    .lean();
}

export async function loadStay(reservationId, hostPropertyId) {
  if (!reservationId) return null;
  const Booking = (await import("@/models/Booking")).default;
  const stay = await Booking.findById(reservationId)
    .select("propertyId checkIn checkOut status listed guestName")
    .lean();
  if (!stay) return null;
  if (String(stay.propertyId) !== String(hostPropertyId)) return null;
  return stay;
}

export async function notifyCleanerOfJob(job, propertyName) {
  const userId = job.requestedCleanerId || job.cleanerId;
  if (!userId) return;
  const start = job.scheduledStartTime;
  const end = job.scheduledEndTime;
  const date = job.scheduledDate;
  await notifyCleaning({
    userId,
    jobId: job._id,
    kind: job.status === "requested" ? "cleaning_request" : "cleaning_scheduled",
    title: "New cleaning",
    body: `${propertyName} · ${date} · ${start}–${end}`,
  });
  await notifyCleanerNewJob({
    cleanerUserId: userId,
    propertyName,
    scheduledDate: date,
    scheduledStartTime: start,
    scheduledEndTime: end,
    jobId: String(job._id),
  });
}

export async function createCleaningJob({
  hostId,
  propertyId,
  cleaningType,
  hostNotes,
  cleanerId,
  reservationId,
  agreedPrice,
  currency,
}) {
  const owned = await assertHostOwnsProperty(propertyId, hostId);
  if (!owned.ok) return owned;

  const type = CLEANING_TYPES.includes(cleaningType) ? cleaningType : "checkout";
  const settings = await PropertyCleaningSettings.findOne({
    propertyId,
  }).lean();
  const stay = await loadStay(reservationId, propertyId);
  const next = stay
    ? await nextStayAfter(propertyId, stay.checkOut)
    : await nextStayAfter(propertyId, localTodayYmd());

  const today = localTodayYmd();
  let plan = planCleaningWindow({
    type,
    checkOutTime: owned.property.checkOutTime || "11:00",
    checkInTime: owned.property.checkInTime || "15:00",
    booking: stay,
    nextBooking: next && String(next._id) !== String(stay?._id) ? next : null,
    todayYmd: today,
    settingsMinutes: settings?.estimatedMinutes,
  });

  if (
    !stay &&
    type !== "emergency" &&
    plan.scheduledDate === today &&
    minutesOfNowPast(owned.property.checkOutTime || "11:00")
  ) {
    plan = {
      ...plan,
      scheduledDate: addDaysYmd(today, 1),
    };
  }

  const checklistSource = settings?.checklist?.length
    ? settings.checklist
    : DEFAULT_CHECKLIST;

  let status = "pending";
  let assigned = null;
  let requested = null;
  const chosenCleaner = cleanerId || (await findAssignedCleaner(hostId, propertyId));

  if (chosenCleaner) {
    const link = await HostCleanerLink.findOne({
      hostId,
      cleanerId: chosenCleaner,
      status: "active",
    }).lean();
    if (!link) {
      return { ok: false, status: 400, error: "Cleaner is not on your trusted list" };
    }
    const conflict = await cleanerHasConflict({
      cleanerId: chosenCleaner,
      scheduledDate: plan.scheduledDate,
      scheduledStartTime: plan.scheduledStartTime,
      scheduledEndTime: plan.scheduledEndTime,
    });
    if (conflict) {
      return { ok: false, status: 409, error: "This cleaner already has a job in that window" };
    }
    status = "requested";
    requested = chosenCleaner;
  }

  const job = await CleaningJob.create({
    hostId: String(hostId),
    propertyId,
    reservationId: stay?._id || undefined,
    cleanerId: assigned,
    requestedCleanerId: requested,
    propertyName: owned.property.name || "",
    propertyAddress: formatPropertyAddress(owned.property),
    checkoutTime: owned.property.checkOutTime || "11:00",
    scheduledDate: plan.scheduledDate,
    scheduledStartTime: plan.scheduledStartTime,
    scheduledEndTime: plan.scheduledEndTime,
    estimatedDuration: plan.estimatedDuration,
    status,
    cleaningType: plan.cleaningType,
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

  await notifyCleanerOfJob(job.toObject(), owned.property.name);
  return { ok: true, job: job.toObject() };
}

function minutesOfNowPast(checkOutTime) {
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const [nh, nm] = hm.split(":").map(Number);
  const [ch, cm] = String(checkOutTime).split(":").map(Number);
  return nh * 60 + nm >= (ch || 0) * 60 + (cm || 0);
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
