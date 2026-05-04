import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

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
      return Response.json({
        success: true,
        message: "Transaction already saved",
        transaction: existingTx,
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
    });

    await newTransaction.save();

    return Response.json(
      { success: true, transaction: newTransaction },
      { status: 201 },
    );
  } catch (error) {
    console.error("Save transaction error:", error);
    return new Response("Failed to save transaction", { status: 500 });
  }
};
