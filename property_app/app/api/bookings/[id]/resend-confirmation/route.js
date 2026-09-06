import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import {
  bookingEmailConfigError,
  sendEmailsForBooking,
} from "@/utils/bookings/finalizePaidTransaction";
import { countNights } from "@/utils/availability/validateStay";
import { isPropertyOwner } from "@/utils/availability/propertyAccess";
import { evaluateBookingPolicy } from "@/utils/bookings/bookingPolicy";
import { resolveHostContact } from "@/utils/email/resolveHostContact";

/**
 * POST /api/bookings/[id]/resend-confirmation
 * Force-resend guest + host confirmation emails.
 * Allowed: booking guest, property host (owner), or admin.
 */
export async function POST(_request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const configErr = bookingEmailConfigError();
    if (configErr) {
      return Response.json({ error: configErr }, { status: 503 });
    }

    const { id } = await params;
    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const property = await Property.findById(booking.propertyId)
      .select("owner seller_info name bookingPolicy")
      .lean();

    const isGuest = String(booking.guestId) === String(session.user.id);
    const isHost = property && isPropertyOwner(property, session.user.id);
    const isAdmin = isOpsStaff(session.user.role);

    // Guests should use My Bookings for trips only — resend is a host/admin tool.
    // Keep guest access for backwards compatibility of the API, but host manage UI
    // is the intended surface. Allow guest only if they own the booking (admin tools).
    if (!isGuest && !isHost && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prefer host/admin for product UX; guest may still call if needed.
    const actor = isAdmin ? "admin" : isHost ? "host" : "guest";
    const policy = evaluateBookingPolicy(booking, property, "resend", new Date(), {
      actor,
    });
    if (!policy.allowed) {
      return Response.json(
        { error: policy.reason || "Resend not allowed" },
        { status: 403 },
      );
    }

    const tx = booking.transactionId
      ? await Transaction.findOne({
          transaction_id: booking.transactionId,
        }).lean()
      : null;

    const guest = {
      guestId: booking.guestId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
    };

    const host = await resolveHostContact(property, {
      host_email: tx?.host_email,
      host_name: tx?.host_name,
    });

    const body = {
      transaction_id: booking.transactionId,
      property_id: booking.propertyId,
      property_name: booking.propertyName || property?.name || tx?.property_name,
      host_email: host.hostEmail,
      host_name: host.hostName,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      amount: booking.amount ?? tx?.amount,
      currency: booking.currency ?? tx?.currency,
      payment_mode: booking.paymentMode,
      guest_phone: booking.guestPhone,
    };

    const nights =
      tx?.nights ?? countNights(booking.checkIn, booking.checkOut);

    const emails = await sendEmailsForBooking(booking._id, body, guest, nights, {
      force: true,
    });

    return Response.json({
      success: true,
      bookingId: String(booking._id),
      emails: {
        attempted: emails.attempted,
        configError: emails.configError || null,
        guestStatus: emails.guestStatus || null,
        hostStatus: emails.hostStatus || null,
        guestError: emails.results?.guest?.error || null,
        hostError: emails.results?.host?.error || null,
      },
    });
  } catch (error) {
    console.error("resend-confirmation:", error);
    return Response.json(
      { error: "Failed to resend confirmation emails" },
      { status: 500 },
    );
  }
}
