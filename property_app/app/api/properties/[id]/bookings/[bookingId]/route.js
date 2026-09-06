import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  getPropertyForApi,
  isPropertyOwner,
  assertVerifiedHost,
} from "@/utils/availability/propertyAccess";
import {
  bookingWithPolicyFlags,
  cancelBookingRecord,
  isValidObjectId,
  modifyBookingDates,
  setBookingListed,
} from "@/utils/bookings/mutateBooking";
import { moveBookingToProperty } from "@/utils/bookings/moveBookingProperty";
import { revalidatePath } from "next/cache";

function revalidateHostOps() {
  // Host Home rings, stay calendar, and reservations list all read this booking.
  revalidatePath("/host");
  revalidatePath("/host/calendar");
  revalidatePath("/host/reservations");
}

async function assertHostOwnsBooking(params, session) {
  const verified = assertVerifiedHost(session);
  if (!verified.ok) {
    return { error: verified.message, status: verified.status };
  }

  const { id: propertyId, bookingId } = await params;
  if (!isValidObjectId(propertyId) || !isValidObjectId(bookingId)) {
    return { error: "Invalid id", status: 400 };
  }

  const property = await getPropertyForApi(propertyId);
  if (!property) {
    return { error: "Property not found", status: 404 };
  }
  if (!isPropertyOwner(property, session.user.id)) {
    return { error: "Only the property owner can manage this reservation", status: 403 };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { error: "Booking not found", status: 404 };
  }
  if (String(booking.propertyId) !== String(propertyId)) {
    return { error: "Booking does not belong to this property", status: 404 };
  }

  return { property, booking, bookingId, propertyId };
}

/**
 * PATCH /api/properties/[id]/bookings/[bookingId]
 * Host modify dates: { checkIn, checkOut }
 * Host unlist/relist (hide from calendars, keep the record): { listed: false|true }
 * Host move to another owned listing (same dates): { targetPropertyId }
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const loaded = await assertHostOwnsBooking(params, session);
    if (loaded.error) {
      return Response.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json().catch(() => ({}));
    const wantsMove = Boolean(body.targetPropertyId);
    const wantsListed = typeof body.listed === "boolean";
    const wantsDates = Boolean(body.checkIn || body.checkOut);
    if ([wantsMove, wantsListed, wantsDates].filter(Boolean).length > 1) {
      return Response.json(
        { error: "Send only one change at a time (move, dates, or unlist)." },
        { status: 400 },
      );
    }

    if (wantsMove) {
      const result = await moveBookingToProperty({
        bookingId: loaded.bookingId,
        targetPropertyId: body.targetPropertyId,
        actor: "host",
        actorUserId: session.user.id,
        expectedVersion: body.version,
        sourceProperty: loaded.property,
      });

      if (!result.ok) {
        return Response.json(
          { error: result.error, code: result.code },
          { status: result.status || 400 },
        );
      }

      const destProperty = await getPropertyForApi(result.destProperty.id);
      revalidateHostOps();
      return Response.json({
        success: true,
        moved: true,
        booking: bookingWithPolicyFlags(
          result.booking,
          destProperty || loaded.property,
          "host",
        ),
        sourceProperty: result.sourceProperty,
        destProperty: result.destProperty,
        emails: result.emails || null,
      });
    }

    if (wantsListed) {
      const result = await setBookingListed({
        bookingId: loaded.bookingId,
        listed: body.listed,
        actor: "host",
        actorUserId: session.user.id,
        property: loaded.property,
      });

      if (!result.ok) {
        return Response.json(
          { error: result.error, code: result.code },
          { status: result.status || 400 },
        );
      }

      revalidateHostOps();
      return Response.json({
        success: true,
        booking: bookingWithPolicyFlags(result.booking, loaded.property, "host"),
      });
    }

    const result = await modifyBookingDates({
      bookingId: loaded.bookingId,
      actor: "host",
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      property: loaded.property,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, code: result.code },
        { status: result.status || 400 },
      );
    }

    revalidateHostOps();
    return Response.json({
      success: true,
      booking: bookingWithPolicyFlags(result.booking, loaded.property, "host"),
      nights: result.nights,
      emails: result.emails || null,
    });
  } catch (error) {
    console.error("PATCH property booking:", error);
    return Response.json({ error: "Failed to modify reservation" }, { status: 500 });
  }
}

/**
 * DELETE /api/properties/[id]/bookings/[bookingId]
 * Host cancel. Body optional: { reason }
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const loaded = await assertHostOwnsBooking(params, session);
    if (loaded.error) {
      return Response.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json().catch(() => ({}));
    const result = await cancelBookingRecord({
      bookingId: loaded.bookingId,
      actor: "host",
      actorUserId: session.user.id,
      reason: body.reason,
      property: loaded.property,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, code: result.code },
        { status: result.status || 400 },
      );
    }

    revalidateHostOps();
    return Response.json({
      success: true,
      booking: bookingWithPolicyFlags(result.booking, loaded.property, "host"),
      refundEligible: result.refundEligible,
      emails: result.emails || null,
    });
  } catch (error) {
    console.error("DELETE property booking:", error);
    return Response.json({ error: "Failed to cancel reservation" }, { status: 500 });
  }
}
