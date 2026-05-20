import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { isPropertyOwner } from "@/utils/availability/propertyAccess";

export async function loadBookingById(bookingId) {
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return null;
  }
  return Booking.findById(bookingId).lean();
}

export async function loadBookingWithProperty(bookingId) {
  const booking = await loadBookingById(bookingId);
  if (!booking) return null;

  const property = await Property.findById(booking.propertyId)
    .select("name owner images location rates seller_info")
    .lean();

  if (!property) {
    return { booking, property: null };
  }

  return { booking, property };
}

export function assertGuestOwnership(booking, sessionUserId) {
  if (!booking || !sessionUserId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  if (String(booking.guestId) !== String(sessionUserId)) {
    return { ok: false, status: 403, error: "You do not have access to this booking" };
  }
  return { ok: true };
}

export function assertHostOwnership(property, sessionUserId) {
  if (!sessionUserId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  if (!property) {
    return { ok: false, status: 404, error: "Property not found" };
  }
  if (!isPropertyOwner(property, sessionUserId)) {
    return {
      ok: false,
      status: 403,
      error: "Only the property owner can manage this booking",
    };
  }
  return { ok: true };
}

export function hostContactFromProperty(property) {
  const seller = property?.seller_info || {};
  return {
    hostEmail: seller.email || undefined,
    hostName: seller.name || undefined,
  };
}
