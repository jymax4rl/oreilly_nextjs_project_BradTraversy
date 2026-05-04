import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

/** GeniusPay statuses (API may occasionally return localized strings). */
function normalizeGeniusPayStatus(status) {
  if (status == null || typeof status !== "string") return "";
  const s = status.toLowerCase().trim();
  const map = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    success: "completed",
    successful: "completed",
    failed: "failed",
    cancelled: "cancelled",
    expired: "expired",
    refunded: "refunded",
    "en attente": "pending",
    "en cours": "processing",
    terminé: "completed",
    terminee: "completed",
  };
  return map[s] || s;
}

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

    const rawRequestBody = await request.text();
    let body = {};
    try {
      body = rawRequestBody ? JSON.parse(rawRequestBody) : {};
    } catch (parseError) {
      console.error("Invalid JSON payload for /api/transactions", {
        rawRequestBody,
        parseError,
      });
      return Response.json(
        {
          success: false,
          message: "Invalid request payload. Expected JSON like {\"reference\":\"...\"}.",
        },
        { status: 400 },
      );
    }
    console.log("Transactions API payload:", body);
    const paymentReference = body.reference || body.tx_ref || body.payment_reference;

    if (!paymentReference) {
      return Response.json(
        { success: false, message: "Payment reference is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GENIUSPAY_API_KEY?.trim();
    const apiSecret = process.env.GENIUSPAY_API_SECRET?.trim();

    if (!apiKey || !apiSecret) {
      return Response.json(
        { success: false, message: "GeniusPay credentials are not configured" },
        { status: 500 },
      );
    }

    const referenceIsSandbox = /^SANDBOX_/i.test(paymentReference);
    if (referenceIsSandbox && apiKey.includes("_live_")) {
      return Response.json(
        {
          success: false,
          message:
            "Environment mismatch: SANDBOX reference detected, but live GeniusPay keys are configured. Use pk_sandbox_/sk_sandbox_ for this transaction.",
        },
        { status: 400 },
      );
    }

    // Verify with GeniusPay before trusting request data.
    const verifyRes = await fetch(
      `https://pay.genius.ci/api/v1/merchant/payments/${paymentReference}`,
      {
        headers: {
          "X-API-Key": apiKey,
          "X-API-Secret": apiSecret,
          Accept: "application/json",
        },
      },
    );

    const verifyRaw = await verifyRes.text();
    let verifyData = {};
    try {
      verifyData = verifyRaw ? JSON.parse(verifyRaw) : {};
    } catch {
      return Response.json(
        {
          success: false,
          message: "GeniusPay verify response was not valid JSON",
        },
        { status: 502 },
      );
    }
    const payment = verifyData?.data;

    if (
      !verifyRes.ok ||
      !verifyData.success ||
      !payment
    ) {
      console.error("GeniusPay verify failed", {
        paymentReference,
        providerStatus: verifyRes.status,
        providerBody: verifyData,
      });
      return Response.json(
        {
          success: false,
          message:
            verifyData?.error?.message ||
            verifyData?.message ||
            "Transaction verification failed",
          provider_status: verifyRes.status,
        },
        { status: 400 },
      );
    }

    const normalizedStatus = normalizeGeniusPayStatus(payment.status);
    if (normalizedStatus === "pending" || normalizedStatus === "processing") {
      return Response.json(
        {
          success: false,
          completed: false,
          message: `Payment status is ${payment.status}; waiting for completion.`,
          payment,
        },
        { status: 202 },
      );
    }

    if (normalizedStatus !== "completed") {
      return Response.json(
        {
          success: false,
          completed: false,
          message: `Payment status is ${payment.status}; not saved.`,
          payment,
        },
        { status: 400 },
      );
    }

    const numericId = Number(payment.id);
    if (!Number.isFinite(numericId)) {
      return Response.json(
        {
          success: false,
          message: "GeniusPay verify response missing numeric payment id",
        },
        { status: 400 },
      );
    }

    const amountNum = Number(payment.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return Response.json(
        { success: false, message: "GeniusPay verify response has invalid amount" },
        { status: 400 },
      );
    }

    const metadata = payment.metadata || {};

    let propertyId = metadata.property_id || body.property_id;
    if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
      propertyId = undefined;
    }

    const doc = {
      transaction_id: numericId,
      tx_ref: payment.reference || paymentReference,
      gateway_reference: payment.reference || paymentReference,
      amount: amountNum,
      currency: payment.currency,
      status: normalizedStatus,
      customer_name: actualCustomerName || payment.customer?.name,
      customer_email:
        actualCustomerEmail || payment.customer?.email || metadata.customer_email,
      provider_created_at: payment.created_at
        ? new Date(payment.created_at)
        : new Date(),
      user: userId,
      property_id: propertyId || undefined,
      property_name: metadata.property_name || body.property_name,
      host_id: metadata.host_id || body.host_id,
      host_name: metadata.host_name || body.host_name,
      host_email: metadata.host_email || body.host_email,
    };

    // Upsert by GeniusPay reference (MTX-… / SANDBOX-…), NOT by numeric id alone:
    // Flutterwave rows already use small numeric transaction_id values; reusing id
    // would overwrite an old row instead of inserting a new GeniusPay document.
    const saved = await Transaction.findOneAndUpdate(
      { tx_ref: payment.reference || paymentReference },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return Response.json(
      {
        success: true,
        completed: true,
        transaction: saved,
        payment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Save transaction error:", error);
    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to save transaction",
      },
      { status: 500 },
    );
  }
};
