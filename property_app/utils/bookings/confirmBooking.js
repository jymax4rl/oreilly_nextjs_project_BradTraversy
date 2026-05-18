import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";
import {
  countNights,
  validateStayDates,
} from "@/utils/availability/validateStay";

/**
 * Create or return a confirmed booking after verified payment.
 * Idempotent on transactionId.
 */
export async function confirmBookingFromPayment({
  propertyId,
  guestId,
  guestName,
  guestEmail,
  checkIn,
  checkOut,
  transactionId,
  amount,
  currency,
  propertyName,
}) {
  if (!propertyId || !guestId || !checkIn || !checkOut) {
    return {
      ok: false,
      error: "Missing booking fields (property, guest, or dates)",
    };
  }

  if (transactionId != null) {
    const existing = await Booking.findOne({ transactionId }).lean();
    if (existing) {
      return { ok: true, booking: existing, created: false };
    }
  }

  const validation = validateStayDates(
    checkIn,
    checkOut,
    (await getAvailabilityPayload(propertyId)).unavailableRanges || [],
  );
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error || "Dates are no longer available",
    };
  }

  const booking = await Booking.create({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    guestId: String(guestId),
    guestName: guestName || undefined,
    guestEmail: guestEmail || undefined,
    checkIn: validation.checkIn,
    checkOut: validation.checkOut,
    status: "confirmed",
    transactionId: transactionId ?? undefined,
    amount: amount != null ? Number(amount) : undefined,
    currency: currency || undefined,
    propertyName: propertyName || undefined,
  });

  return {
    ok: true,
    booking: booking.toObject(),
    created: true,
    nights: countNights(validation.checkIn, validation.checkOut),
  };
}
