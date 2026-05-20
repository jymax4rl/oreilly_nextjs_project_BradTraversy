import { countNights } from "@/utils/availability/validateStay";
import {
  calculateBookingFees,
  calculateStayTotal,
  getDefaultNightlyUsd,
} from "@/utils/propertyRates";
import { getAvailabilityPayload } from "@/utils/availability/availabilityService";

/**
 * Snapshot for refunds / modify price deltas (USD breakdown).
 */
export async function buildPricingSnapshot(propertyId, propertyRates, checkIn, checkOut) {
  const availability = await getAvailabilityPayload(propertyId);
  const stay = calculateStayTotal(
    propertyRates,
    availability.customDayRates || [],
    checkIn,
    checkOut,
  );
  if (!stay) return null;

  const fees = calculateBookingFees(stay.base);
  const nights = countNights(checkIn, checkOut);

  return {
    nightlyRate: getDefaultNightlyUsd(propertyRates),
    accommodationBase: fees.base,
    cleaningFee: fees.cleaningFee,
    platformFee: fees.commission,
    total: fees.total,
    nights,
    currency: "USD",
  };
}

export function pricingSnapshotFromBookingAmount(booking) {
  if (booking?.amount == null) return null;
  return {
    accommodationBase: null,
    cleaningFee: null,
    platformFee: null,
    total: Number(booking.amount),
    nights: countNights(booking.checkIn, booking.checkOut),
    currency: booking.currency || "USD",
  };
}
