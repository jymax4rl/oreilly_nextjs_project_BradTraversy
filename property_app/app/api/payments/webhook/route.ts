import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/config/database";
import { finalizeFromFlutterwaveCharge } from "@/utils/bookings/finalizePaidTransaction";

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

    const hash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (signature !== hash) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(payload);

    if (
      event.event === "charge.completed" &&
      event.data?.status === "successful"
    ) {
      const transactionId = event.data.id;

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
        verifyData.data?.status === "successful"
      ) {
        await connectToDatabase();
        const result = await finalizeFromFlutterwaveCharge(verifyData.data);

        if (result.bookingError) {
          console.warn(
            "Webhook: payment ok, booking issue:",
            result.bookingError,
            "tx",
            transactionId,
          );
        } else if (result.bookingId) {
          console.log("Webhook: booking confirmed", result.bookingId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
