import Booking from "@/models/Booking";
import Property from "@/models/Property";
import CleaningJob from "@/models/CleaningJob";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import { createCleaningJob } from "@/utils/cleaners/jobs";

export async function ensureCheckoutCleaningJob(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking || booking.status !== "confirmed") return null;

  const existing = await CleaningJob.findOne({
    reservationId: booking._id,
    cleaningType: "checkout",
    status: { $ne: "cancelled" },
  }).lean();
  if (existing) return existing;

  const property = await Property.findById(booking.propertyId).select("owner").lean();
  if (!property) return null;

  const settings = await PropertyCleaningSettings.findOne({
    propertyId: property._id,
  })
    .select("autoCreateOnCheckout")
    .lean();

  if (settings && settings.autoCreateOnCheckout === false) {
    return null;
  }

  const result = await createCleaningJob({
    hostId: property.owner,
    propertyId: property._id,
    reservationId: booking._id,
    cleaningType: "checkout",
  });
  return result.ok ? result.job : null;
}

export async function safeEnsureCheckoutCleaningJob(bookingId) {
  try {
    return await ensureCheckoutCleaningJob(bookingId);
  } catch (error) {
    console.error("[cleaners] checkout job create failed:", error);
    return null;
  }
}
