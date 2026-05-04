// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("verif-hash");
    const payload = await req.text();
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!secret) {
      console.error("FLUTTERWAVE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { message: "Server misconfigured" },
        { status: 500 },
      );
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (signature !== hash) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Only process successful charges
    if (
      event.event === "charge.completed" &&
      event.data?.status === "successful"
    ) {
      const { tx_ref, id: transactionId, amount, currency } = event.data;

      // Double-verify with Flutterwave API (prevents spoofed webhooks)
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        },
      );

      const verifyData = await verifyRes.json();

      if (
        verifyData.status === "success" &&
        verifyData.data.status === "successful"
      ) {
        // TODO: Update your MongoDB booking status here
        // await db.collection('bookings').updateOne(
        //   { txRef },
        //   { $set: { status: 'paid', paidAt: new Date() } }
        // );

        console.log("Payment confirmed:", tx_ref, amount, currency);
      }
    }

    // Always return 200 so Flutterwave doesn't retry
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
