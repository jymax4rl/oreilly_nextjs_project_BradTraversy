// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const eventName = req.headers.get("x-webhook-event");
    const payload = await req.text();
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET?.trim();
    const apiKey = process.env.GENIUSPAY_API_KEY?.trim();
    const apiSecret = process.env.GENIUSPAY_API_SECRET?.trim();

    if (!secret) {
      console.error("GENIUSPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { message: "Server misconfigured" },
        { status: 500 },
      );
    }

    if (!signature || !timestamp) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ageSeconds = Math.abs(Date.now() / 1000 - Number.parseInt(timestamp, 10));
    if (Number.isNaN(ageSeconds) || ageSeconds > 300) {
      return NextResponse.json({ message: "Stale webhook timestamp" }, { status: 400 });
    }

    // GeniusPay signature format: HMAC-SHA256(timestamp + "." + payload, secret)
    const signedPayload = `${timestamp}.${payload}`;
    const hash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (signature !== hash) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const providerEvent = eventName || event.event;

    // Only process successful payment notifications.
    if (providerEvent === "payment.success" && event.data?.reference) {
      if (!apiKey || !apiSecret) {
        return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
      }

      const reference = event.data.reference;
      const verifyRes = await fetch(
        `https://pay.genius.ci/api/v1/merchant/payments/${reference}`,
        {
          headers: {
            "X-API-Key": apiKey,
            "X-API-Secret": apiSecret,
            Accept: "application/json",
          },
        },
      );

      const verifyRaw = await verifyRes.text();
      let verifyData: { success?: boolean; data?: any } = {};
      try {
        verifyData = verifyRaw ? JSON.parse(verifyRaw) : {};
      } catch {
        return NextResponse.json({ received: true });
      }

      const pay = verifyData.data;
      const st = (pay?.status || "").toLowerCase().trim();
      if (!verifyRes.ok || !verifyData.success || st !== "completed") {
        return NextResponse.json({ received: true });
      }

      await connectToDatabase();

      const payment = verifyData.data;
      const metadata = payment.metadata || {};

      let propertyId = metadata.property_id;
      if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
        propertyId = null;
      }

      const numericId = Number(payment.id);
      if (!Number.isFinite(numericId)) {
        return NextResponse.json({ received: true });
      }

      await Transaction.findOneAndUpdate(
        { tx_ref: payment.reference },
        {
          transaction_id: numericId,
          tx_ref: payment.reference,
          gateway_reference: payment.reference,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: "completed",
          customer_name: payment.customer?.name || event.data?.customer_name,
          customer_email:
            payment.customer?.email || metadata.customer_email || null,
          provider_created_at: payment.created_at
            ? new Date(payment.created_at)
            : new Date(),
          property_id: propertyId || undefined,
          property_name: metadata.property_name || null,
          host_id: metadata.host_id || null,
          host_name: metadata.host_name || null,
          host_email: metadata.host_email || null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    // Always return 200 so GeniusPay doesn't keep retrying.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
