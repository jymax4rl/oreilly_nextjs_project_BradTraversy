import { NextResponse } from "next/server";
import connectToDatabase from "@/config/database";
import { finalizeFromCreemCheckout } from "@/utils/bookings/finalizePaidTransaction";
import { verifyCreemWebhookSignature } from "@/utils/payments/creemWebhook";

/**
 * POST /api/payments/creem/webhook
 * Creem sends checkout.completed (and related) events here.
 * Configure the URL in the Creem dashboard → Developers → Webhooks.
 */
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("creem-signature");
    const secret = process.env.CREEM_WEBHOOK_SECRET;

    if (!secret) {
      console.error("CREEM_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { message: "Server misconfigured" },
        { status: 500 },
      );
    }

    if (!verifyCreemWebhookSignature(rawBody, signature, secret)) {
      console.error("Invalid Creem webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.eventType || event.event_type || event.type;
    const checkout = event.object || event.data || event;

    if (
      eventType === "checkout.completed" ||
      checkout?.status === "completed" ||
      checkout?.object === "checkout"
    ) {
      const status = checkout?.status;
      const orderStatus = checkout?.order?.status;
      const paid =
        status === "completed" ||
        orderStatus === "paid" ||
        orderStatus === "completed";

      if (paid || eventType === "checkout.completed") {
        await connectToDatabase();
        const result = await finalizeFromCreemCheckout(checkout);

        if (result.bookingError) {
          console.warn(
            "Creem webhook: payment ok, booking issue:",
            result.bookingError,
            "checkout",
            checkout?.id,
          );
        } else if (result.bookingId) {
          console.log("Creem webhook: booking confirmed", result.bookingId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Creem webhook error:", error);
    // Acknowledge to avoid aggressive retries on parse bugs; logs capture the fault.
    return NextResponse.json({ received: true });
  }
}
