// app/api/payments/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as AuthOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency, email, phone_number, name, bookingId } = body;

    // Validate required fields
    if (!amount || !currency || !email || !bookingId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate unique transaction reference (idempotent)
    const txRef = `KAMA-${bookingId}-${Date.now()}`;

    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify`,
      meta: {
        booking_id: bookingId,
        user_id: userId,
      },
      customer: {
        email: email,
        phonenumber: phone_number,
        name: name,
      },
      customizations: {
        title: "Kama Properties",
        description: `Booking #${bookingId}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`,
      },
      // Enable mobile money by default for African currencies
      payment_options: "card,mobilemoney,ussd",
    };

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status !== "success") {
      return NextResponse.json(
        { message: data.message || "Payment initialization failed" },
        { status: 400 },
      );
    }

    // Store pending transaction in your database
    // await createPendingTransaction({ txRef, bookingId, amount, currency });

    return NextResponse.json({
      status: "success",
      data: {
        link: data.data.link, // Payment URL
        tx_ref: txRef,
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
