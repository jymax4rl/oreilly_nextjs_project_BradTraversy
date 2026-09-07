import { NextResponse } from "next/server";
import connectToDatabase from "@/config/database";
import { finalizeFromGeniusPayPayment } from "@/utils/bookings/finalizePaidTransaction";
import {
  isGeniusPayWebhookTimestampFresh,
  verifyGeniusPayWebhookSignature,
} from "@/utils/payments/geniusPayWebhook";

/**
 * POST /api/payments/geniuspay/webhook
 * Configure in GeniusPay dashboard → Webhooks:
 *   https://www.isisel.com/api/payments/geniuspay/webhook
 * Events: payment.success (optionally payment.failed)
 *
 * Signature: HMAC-SHA256(timestamp + "." + raw_body, whsec_…)
 * Headers: X-Webhook-Signature, X-Webhook-Timestamp, X-Webhook-Event
 */
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const eventHeader = req.headers.get("x-webhook-event");
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("GENIUSPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { message: "Server misconfigured" },
        { status: 500 },
      );
    }

    if (
      !verifyGeniusPayWebhookSignature(
        rawBody,
        signature,
        timestamp,
        secret,
      )
    ) {
      console.error("Invalid GeniusPay webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isGeniusPayWebhookTimestampFresh(timestamp)) {
      console.error("GeniusPay webhook timestamp too old", timestamp);
      return NextResponse.json(
        { message: "Timestamp too old" },
        { status: 400 },
      );
    }

    const event = JSON.parse(rawBody);
    const eventType =
      eventHeader || event.event || event.type || event.event_type;
    const payment = event.data || event.object || event;

    const paidEvent =
      eventType === "payment.success" ||
      eventType === "payment.completed" ||
      String(payment?.status || "").toLowerCase() === "completed" ||
      String(payment?.status || "").toLowerCase() === "successful";

    if (paidEvent) {
      await connectToDatabase();
      const result = await finalizeFromGeniusPayPayment(payment);

      if (result.bookingError) {
        console.warn(
          "GeniusPay webhook: payment ok, booking issue:",
          result.bookingError,
          "ref",
          payment?.reference || payment?.id,
        );
      } else if (result.bookingId) {
        console.log(
          "GeniusPay webhook: booking confirmed",
          result.bookingId,
        );
      }
    } else {
      console.info("GeniusPay webhook ignored event", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("GeniusPay webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
