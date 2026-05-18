import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { finalizePaidTransaction } from "@/utils/bookings/finalizePaidTransaction";

export const POST = async (request) => {
  try {
    await connectToDatabase();

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

    const result = await finalizePaidTransaction(
      {
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
        property_id: body.property_id,
        property_name: body.property_name,
        host_id: body.host_id,
        host_name: body.host_name,
        host_email: body.host_email,
        check_in: body.check_in,
        check_out: body.check_out,
        nights: body.nights,
      },
      {
        userId: userId?.toString(),
        customerName: actualCustomerName || body.customer?.name,
        customerEmail: actualCustomerEmail || body.customer?.email,
      },
    );

    return Response.json(
      {
        success: true,
        transaction: result.transaction,
        bookingId: result.bookingId,
        bookingError: result.bookingError,
        message: result.created ? undefined : "Transaction already saved",
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Save transaction error:", error);
    return new Response("Failed to save transaction", { status: 500 });
  }
};
