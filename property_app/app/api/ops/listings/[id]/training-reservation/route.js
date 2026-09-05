import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { createManualBookingRequest } from "@/utils/bookings/createManualBooking";
import {
  TRAINING_BOOKING_SOURCE,
  TRAINING_GUEST,
  ensureTrainingGuestUser,
} from "@/utils/opsTraining/guest";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function looksLikeEmail(raw) {
  const value = String(raw || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * POST /api/ops/listings/[id]/training-reservation
 * Ops-only: create a confirmed training stay on a host listing.
 */
export async function POST(request, { params }) {
  const gate = await requireOpsApi();
  if (gate.error) return gate.error;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const checkIn = body?.checkIn;
    const checkOut = body?.checkOut;
    const guestName =
      String(body?.guestName || "").trim() || TRAINING_GUEST.username;
    const guestEmailRaw = String(body?.guestEmail || "").trim();
    const guestEmail = guestEmailRaw || TRAINING_GUEST.email;
    const guestPhone =
      String(body?.guestPhone || "").trim() || TRAINING_GUEST.phone;
    const status = body?.status === "pending" ? "pending" : "confirmed";

    if (!looksLikeEmail(guestEmail)) {
      return Response.json({ error: "Enter a valid guest email" }, { status: 400 });
    }

    const guest = await ensureTrainingGuestUser();

    const result = await createManualBookingRequest({
      propertyId: id,
      guestId: String(guest._id),
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      createdByHost: true,
      status,
      skipEmails: true,
      source: TRAINING_BOOKING_SOURCE,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: result.status || 400 },
      );
    }

    revalidatePath("/host");
    revalidatePath("/host/calendar");
    revalidatePath("/host/reservations");
    revalidatePath("/host/listings");

    return Response.json(
      {
        success: true,
        bookingId: String(result.booking._id),
        status: result.booking.status,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        guestName: result.booking.guestName,
        guestPhone: result.booking.guestPhone,
        source: TRAINING_BOOKING_SOURCE,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST ops training reservation:", error);
    return Response.json(
      { error: "Could not create training reservation" },
      { status: 500 },
    );
  }
}
