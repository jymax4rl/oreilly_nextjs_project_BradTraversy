import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { confirmBookingFromPayment } from "@/utils/bookings/confirmBooking";
import User from "@/models/User";

/**
 * One-off repair: create a confirmed booking from an existing transaction
 * that was saved before the booking flow existed.
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const tx = await Transaction.findById(id);
    if (!tx) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (tx.booking) {
      return Response.json({
        success: true,
        message: "Booking already linked",
        bookingId: tx.booking.toString(),
      });
    }

    const body = await request.json().catch(() => ({}));
    if (body.check_in) tx.check_in = body.check_in;
    if (body.check_out) tx.check_out = body.check_out;
    if (body.nights != null) tx.nights = body.nights;

    if (!tx.check_in || !tx.check_out || !tx.property_id) {
      return Response.json(
        {
          error:
            "Transaction missing check_in, check_out, or property_id. POST JSON { check_in, check_out } to repair.",
        },
        { status: 400 },
      );
    }

    await tx.save();

    let guestId = tx.user?.toString();
    if (!guestId && tx.customer_email) {
      const user = await User.findOne({ email: tx.customer_email });
      guestId = user?._id?.toString();
    }

    if (!guestId) {
      return Response.json(
        { error: "No user linked to this transaction" },
        { status: 400 },
      );
    }

    const result = await confirmBookingFromPayment({
      propertyId: tx.property_id.toString(),
      guestId,
      guestName: tx.customer_name,
      guestEmail: tx.customer_email,
      checkIn: tx.check_in,
      checkOut: tx.check_out,
      transactionId: tx.transaction_id,
      amount: tx.amount,
      currency: tx.currency,
      propertyName: tx.property_name,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    tx.booking = result.booking._id;
    await tx.save();

    return Response.json({
      success: true,
      bookingId: result.booking._id.toString(),
      created: result.created,
    });
  } catch (error) {
    console.error("create-booking from transaction:", error);
    return Response.json({ error: "Repair failed" }, { status: 500 });
  }
}
