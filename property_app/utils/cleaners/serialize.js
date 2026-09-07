import { sanitizePropertyForCleaner } from "@/utils/cleaners/access";

function userStub(doc, extra = {}) {
  if (!doc) return null;
  if (typeof doc !== "object" || !doc._id) {
    return { _id: String(doc) };
  }
  return {
    _id: String(doc._id),
    name: doc.username || doc.name || "",
    image: doc.image || "",
    ...extra,
  };
}

function mediaList(items = []) {
  return items.map((item) => ({
    _id: item._id ? String(item._id) : undefined,
    url: item.url,
    publicId: item.publicId || "",
    resourceType: item.resourceType || "",
    duration: item.duration ?? null,
    mimeType: item.mimeType || "",
    fileSize: item.fileSize ?? null,
    createdAt: item.createdAt || null,
  }));
}

export function serializeCleaningJob(job, { forCleaner = false } = {}) {
  if (!job) return null;
  const populatedProperty =
    job.propertyId && typeof job.propertyId === "object" ? job.propertyId : null;
  const property = populatedProperty
    ? forCleaner
      ? sanitizePropertyForCleaner(populatedProperty)
      : {
          _id: String(populatedProperty._id),
          name: populatedProperty.name,
          type: populatedProperty.type,
          location: populatedProperty.location,
          checkOutTime: populatedProperty.checkOutTime,
          checkInTime: populatedProperty.checkInTime,
        }
    : job.propertyId
      ? { _id: String(job.propertyId) }
      : null;

  const reservation =
    job.reservationId && typeof job.reservationId === "object"
      ? {
          _id: String(job.reservationId._id),
          checkOut: job.reservationId.checkOut,
          ...(forCleaner
            ? {}
            : { guestName: job.reservationId.guestName || "" }),
        }
      : job.reservationId
        ? { _id: String(job.reservationId) }
        : null;

  return {
    _id: String(job._id),
    hostId: userStub(job.hostId),
    cleanerId: userStub(job.cleanerId),
    requestedCleanerId: userStub(job.requestedCleanerId),
    propertyId: property,
    propertyName: job.propertyName || property?.name || "",
    propertyAddress: job.propertyAddress || "",
    checkoutTime: job.checkoutTime || property?.checkOutTime || "",
    reservationId: reservation,
    scheduledDate: job.scheduledDate,
    scheduledStartTime: job.scheduledStartTime,
    scheduledEndTime: job.scheduledEndTime,
    estimatedDuration: job.estimatedDuration,
    status: job.status,
    cleaningType: job.cleaningType,
    checklist: job.checklist || [],
    propertyInstructions: job.propertyInstructions || "",
    hostNotes: job.hostNotes || "",
    cleanerNotes: forCleaner || !forCleaner ? job.cleanerNotes || "" : "",
    photos: mediaList(job.photos),
    audioReports: mediaList(job.audioReports),
    issueReports: (job.issueReports || []).map((issue) => ({
      _id: issue._id ? String(issue._id) : undefined,
      type: issue.type,
      note: issue.note || "",
      photos: mediaList(issue.photos),
      audio: mediaList(issue.audio),
      status: issue.status,
      createdAt: issue.createdAt,
    })),
    startedAt: job.startedAt || null,
    completionTimestamp: job.completionTimestamp || null,
    agreedPrice: job.agreedPrice ?? null,
    currency: job.currency || "GMD",
    paymentStatus: job.paymentStatus || "unpaid",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function serializeCleanerProfile(profile, user) {
  if (!profile && !user) return null;
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.name ||
    "";
  return {
    _id: profile?._id ? String(profile._id) : null,
    userId: user?._id
      ? String(user._id)
      : profile?.userId
        ? String(profile.userId)
        : null,
    name: displayName,
    email: user?.email || "",
    image: profile?.photoUrl || user?.image || "",
    photoUrl: profile?.photoUrl || user?.image || "",
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    languages: profile?.languages || [],
    yearsExperience: profile?.yearsExperience || 0,
    specialties: profile?.specialties || [],
    availability: profile?.availability || {},
    unavailableDates: profile?.unavailableDates || [],
    maxDailyJobs: profile?.maxDailyJobs || 4,
    minNoticeHours: profile?.minNoticeHours ?? 12,
    preferredRadiusKm: profile?.preferredRadiusKm || 25,
    availableTypes: profile?.availableTypes || [],
    discoverable: Boolean(profile?.discoverable),
    ratingAverage: profile?.ratingAvg || 0,
    ratingCount: profile?.reviewCount || 0,
    completedCleanings: profile?.completedCount || 0,
  };
}

export function serializeHostCleanerLink(link) {
  if (!link) return null;
  const cleaner =
    link.cleanerId && typeof link.cleanerId === "object"
      ? {
          _id: String(link.cleanerId._id),
          name: link.cleanerId.username || link.cleanerId.name || "",
          image: link.cleanerId.image || "",
          email: link.cleanerId.email || "",
        }
      : { _id: String(link.cleanerId) };
  return {
    _id: String(link._id),
    hostId: String(link.hostId?._id || link.hostId),
    cleanerId: cleaner,
    status: link.status,
    assignedPropertyIds: (link.assignedPropertyIds || []).map((id) =>
      typeof id === "object"
        ? { _id: String(id._id), name: id.name }
        : String(id),
    ),
    lastCleaningAt: link.lastJobAt || null,
    completedCleanings: link.completedCleanings || 0,
    createdAt: link.createdAt,
  };
}
