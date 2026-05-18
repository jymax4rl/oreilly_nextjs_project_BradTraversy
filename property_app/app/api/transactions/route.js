import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import Property from "@/models/Property";
import User from "@/models/User";
import {
  formatPropertyLocation,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { confirmBookingFromPayment } from "@/utils/bookings/confirmBooking";
import { sendBookingConfirmationEmails } from "@/utils/email/sendBookingEmails";
import { countNights } from "@/utils/availability/validateStay";

export const POST = async (request) => {
  try {
    await connectToDatabase();

    // We allow unauthenticated saves just in case they were logged out during checkout,
    // but try to associate with user if logged in
    const session = await getServerSession(authOptions);
    let userId = null;
    let actualCustomerName = null;
    let actualCustomerEmail = null;

    if (session?.user) {
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userId = user._id;
        actualCustomerName = user.username;
        actualCustomerEmail = user.email;
      }
    }

    const body = await request.json();

    // Verify with Flutterwave before trusting the data
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${body.transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    const verifyData = await verifyRes.json();

    if (
      verifyData.status !== "success" ||
      verifyData.data.status !== "successful" ||
      verifyData.data.tx_ref !== body.tx_ref
    ) {
      return Response.json(
        { success: false, message: "Transaction verification failed" },
        { status: 400 },
      );
    }

    // THEN proceed with Transaction.findOne and newTransaction.save()
    // Prevent duplicate saves from multiple callbacks
    const existingTx = await Transaction.findOne({
      transaction_id: body.transaction_id,
    });
    if (existingTx) {
      let booking = null;
      if (existingTx.booking) {
        booking = existingTx.booking;
      } else if (body.check_in && body.check_out && body.property_id && userId) {
        const result = await confirmBookingFromPayment({
          propertyId: body.property_id,
          guestId: userId.toString(),
          guestName: actualCustomerName || body.customer?.name,
          guestEmail: actualCustomerEmail || body.customer?.email,
          checkIn: body.check_in,
          checkOut: body.check_out,
          transactionId: body.transaction_id,
          amount: body.amount || body.charged_amount,
          currency: body.currency,
          propertyName: body.property_name,
        });
        if (result.ok && result.booking) {
          booking = result.booking._id;
          existingTx.booking = booking;
          await existingTx.save();
        }
      }
      return Response.json({
        success: true,
        message: "Transaction already saved",
        transaction: existingTx,
        bookingId: booking?.toString?.() ?? booking,
      });
    }

    const newTransaction = new Transaction({
      transaction_id: body.transaction_id,
      tx_ref: body.tx_ref,
      flw_ref: body.flw_ref,
      amount: body.amount || body.charged_amount,
      currency: body.currency,
      status: body.status,
      customer_name: actualCustomerName || body.customer?.name,
      customer_email: actualCustomerEmail || body.customer?.email,
      charge_response_code: body.charge_response_code,
      charge_response_message: body.charge_response_message,
      flutterwave_created_at: body.created_at
        ? new Date(body.created_at)
        : new Date(),
      user: userId,
      property_id: body.property_id,
      property_name: body.property_name,
      host_id: body.host_id,
      host_name: body.host_name,
      host_email: body.host_email,
      check_in: body.check_in,
      check_out: body.check_out,
      nights: body.nights,
    });

    await newTransaction.save();

    let bookingId = null;
    let bookingError = null;

    if (body.check_in && body.check_out && body.property_id && userId) {
      const bookingResult = await confirmBookingFromPayment({
        propertyId: body.property_id,
        guestId: userId.toString(),
        guestName: actualCustomerName || body.customer?.name,
        guestEmail: actualCustomerEmail || body.customer?.email,
        checkIn: body.check_in,
        checkOut: body.check_out,
        transactionId: body.transaction_id,
        amount: body.amount || body.charged_amount,
        currency: body.currency,
        propertyName: body.property_name,
      });

      if (bookingResult.ok && bookingResult.booking) {
        bookingId = bookingResult.booking._id;
        newTransaction.booking = bookingId;
        await newTransaction.save();

        const nights =
          body.nights ??
          bookingResult.nights ??
          countNights(body.check_in, body.check_out);

        let propertyImageUrl;
        let locationLabel;
        let propertyMeta;
        try {
          const property = await Property.findById(body.property_id)
            .select("images location beds baths type")
            .lean();
          if (property) {
            propertyImageUrl = propertyImageAbsoluteUrl(property.images);
            locationLabel = formatPropertyLocation(property.location);
            propertyMeta = formatPropertyMeta(property, locationLabel);
          }
        } catch (err) {
          console.error("Property lookup for booking email:", err);
        }

        sendBookingConfirmationEmails({
          guestEmail: actualCustomerEmail || body.customer?.email,
          guestName: actualCustomerName || body.customer?.name,
          hostEmail: body.host_email,
          hostName: body.host_name,
          propertyName: body.property_name || "Property",
          propertyId: body.property_id,
          propertyImageUrl,
          propertyMeta,
          locationLabel,
          checkIn: body.check_in,
          checkOut: body.check_out,
          nights,
          amount: body.amount || body.charged_amount,
          currency: body.currency,
          transactionId: body.transaction_id,
        }).catch((err) => console.error("Booking email error:", err));
      } else {
        bookingError = bookingResult.error;
        console.error("Booking not created:", bookingError);
      }
    } else if (!userId) {
      bookingError = "Sign in required to link booking to your account";
    } else {
      bookingError = "Missing stay dates on payment";
    }

    return Response.json(
      {
        success: true,
        transaction: newTransaction,
        bookingId: bookingId?.toString?.() ?? bookingId,
        bookingError,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Save transaction error:", error);
    return new Response("Failed to save transaction", { status: 500 });
  }
};
