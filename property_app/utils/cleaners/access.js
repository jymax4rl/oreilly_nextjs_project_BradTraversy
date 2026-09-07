import mongoose from "mongoose";
import CleaningJob from "@/models/CleaningJob";
import HostCleanerLink from "@/models/HostCleanerLink";
import Property from "@/models/Property";

export async function getHostCleaningJob(jobId, hostId) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return CleaningJob.findOne({ _id: jobId, hostId }).lean();
}

export async function getCleanerCleaningJob(jobId, cleanerId) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return CleaningJob.findOne({
    _id: jobId,
    $or: [
      { cleanerId },
      { requestedCleanerId: cleanerId },
    ],
  }).lean();
}

export async function getActiveLink(hostId, cleanerId) {
  return HostCleanerLink.findOne({
    hostId,
    cleanerId,
    status: "active",
  }).lean();
}

export async function cleanerCanSeeProperty(cleanerId, propertyId) {
  const job = await CleaningJob.exists({
    propertyId,
    $or: [{ cleanerId }, { requestedCleanerId: cleanerId }],
    status: { $nin: ["cancelled"] },
  });
  if (job) return true;
  const link = await HostCleanerLink.exists({
    cleanerId,
    status: "active",
    assignedPropertyIds: propertyId,
  });
  return Boolean(link);
}

export async function assertHostOwnsProperty(propertyId, hostId) {
  const property = await Property.findById(propertyId).select("owner name location").lean();
  if (!property) return { ok: false, status: 404, error: "Property not found" };
  if (String(property.owner) !== String(hostId)) {
    return { ok: false, status: 403, error: "You do not own this property" };
  }
  return { ok: true, property };
}

export function formatPropertyAddress(property) {
  const loc = property?.location || {};
  return [loc.street, loc.city, loc.state, loc.country]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function sanitizePropertyForCleaner(property) {
  if (!property) return null;
  return {
    _id: String(property._id),
    name: property.name,
    type: property.type || "",
    beds: property.beds,
    baths: property.baths,
    location: {
      street: property.location?.street || "",
      city: property.location?.city || "",
      state: property.location?.state || "",
      country: property.location?.country || "",
    },
    checkOutTime: property.checkOutTime || "11:00",
    checkInTime: property.checkInTime || "15:00",
  };
}

export function minutesOf(hhmm) {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function timesOverlap(aStart, aEnd, bStart, bEnd) {
  const startA = minutesOf(aStart);
  const endA = minutesOf(aEnd || aStart) || startA + 60;
  const startB = minutesOf(bStart);
  const endB = minutesOf(bEnd || bStart) || startB + 60;
  return startA < endB && startB < endA;
}
