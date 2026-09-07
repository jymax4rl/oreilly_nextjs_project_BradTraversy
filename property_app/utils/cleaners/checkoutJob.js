import Booking from "@/models/Booking";
import Property from "@/models/Property";
import CleaningJob from "@/models/CleaningJob";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import { DEFAULT_CHECKLIST } from "@/utils/cleaners/constants";
import { formatPropertyAddress } from "@/utils/cleaners/access";

function addMinutes(hhmm, minutes) {
  const [h, m] = String(hhmm || "11:00").split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + Number(minutes || 0);
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function ensureCheckoutCleaningJob(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking || booking.status !== "confirmed") return null;

  const existing = await CleaningJob.findOne({
    reservationId: booking._id,
    cleaningType: "checkout",
    status: { $ne: "cancelled" },
  }).lean();
  if (existing) return existing;

  const property = await Property.findById(booking.propertyId).lean();
  if (!property) return null;

  const settings = await PropertyCleaningSettings.findOne({
    propertyId: property._id,
  }).lean();

  if (settings && settings.autoCreateOnCheckout === false) {
    return null;
  }

  const checkoutTime = property.checkOutTime || "11:00";
  const duration = settings?.estimatedMinutes || 150;
  const checklistSource = settings?.checklist?.length
    ? settings.checklist
    : DEFAULT_CHECKLIST;

  try {
    const job = await CleaningJob.create({
      hostId: String(property.owner),
      propertyId: property._id,
      reservationId: booking._id,
      propertyName: property.name || booking.propertyName || "",
      propertyAddress: formatPropertyAddress(property),
      checkoutTime,
      scheduledDate: booking.checkOut,
      scheduledStartTime: checkoutTime,
      scheduledEndTime: addMinutes(checkoutTime, duration),
      estimatedDuration: duration,
      status: "pending",
      cleaningType: settings?.defaultType || "checkout",
      checklist: checklistSource.map((item, index) => ({
        key: item.key || `item-${index}`,
        label: item.label,
        done: false,
      })),
      propertyInstructions: settings?.instructions || "",
      currency: property.rates?.currency || "GMD",
    });
    return job.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      return CleaningJob.findOne({
        reservationId: booking._id,
        cleaningType: "checkout",
      }).lean();
    }
    throw error;
  }
}

export async function safeEnsureCheckoutCleaningJob(bookingId) {
  try {
    return await ensureCheckoutCleaningJob(bookingId);
  } catch (error) {
    console.error("[cleaners] checkout job create failed:", error);
    return null;
  }
}
