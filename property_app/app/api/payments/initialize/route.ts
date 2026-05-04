// app/api/payments/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      currency,
      email,
      phone_number,
      name,
      bookingId,
      country,
      description,
      property_id,
      property_name,
      host_id,
      host_name,
      host_email,
    } = body;

    // Validate required fields
    if (!amount || !currency || !email || !bookingId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GENIUSPAY_API_KEY?.trim();
    const apiSecret = process.env.GENIUSPAY_API_SECRET?.trim();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "GeniusPay credentials are not configured" },
        { status: 500 },
      );
    }

    // GeniusPay merchant API expects pk_sandbox_* / pk_live_* (not ppk_* or other prefixes).
    if (!/^pk_(sandbox|live)_/.test(apiKey)) {
      return NextResponse.json(
        {
          message:
            "GENIUSPAY_API_KEY must start with pk_sandbox_ or pk_live_ (copy the public key from Dashboard → Paramètres → API). If yours starts with ppk_, that is usually a typo.",
        },
        { status: 400 },
      );
    }

    if (!/^sk_(sandbox|live)_/.test(apiSecret)) {
      return NextResponse.json(
        {
          message:
            "GENIUSPAY_API_SECRET must start with sk_sandbox_ or sk_live_ (secret key from the same API page). Sandbox and live keys must not be mixed.",
        },
        { status: 400 },
      );
    }

    const numericAmount =
      typeof amount === "number" ? amount : Number.parseFloat(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const fiatMajor = currency === "USD" || currency === "EUR";
    let chargeAmount = numericAmount;
    if (currency === "XOF" || currency === "XAF") {
      chargeAmount = Math.round(chargeAmount);
    } else if (fiatMajor) {
      chargeAmount = Math.round(chargeAmount * 100) / 100;
    }

    if (currency === "XOF" && chargeAmount < 200) {
      return NextResponse.json(
        { message: "GeniusPay requires at least 200 XOF for this currency." },
        { status: 400 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN;

    if (!appUrl) {
      return NextResponse.json(
        { message: "Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL" },
        { status: 500 },
      );
    }

    // Do not send a fake African `country` when charging USD/EUR — it breaks routing when the payer uses e.g. +33 on GeniusPay checkout.
    const phoneTrimmed =
      typeof phone_number === "string" ? phone_number.trim() : "";
    const countryTrimmed =
      typeof country === "string" ? country.trim() : "";
    const customer: Record<string, string> = {
      name: name || "",
      email: email || "",
    };
    if (phoneTrimmed) customer.phone = phoneTrimmed;
    if (!fiatMajor && countryTrimmed) {
      customer.country = countryTrimmed;
    }

    const payload = {
      amount: chargeAmount,
      currency,
      description: description || `Booking #${bookingId}`,
      customer,
      success_url: `${appUrl}/payments/verify?status=success`,
      error_url: `${appUrl}/payments/verify?status=failed`,
      metadata: {
        booking_id: bookingId,
        user_id: session.user?.id,
        property_id,
        property_name,
        host_id,
        host_name,
        host_email,
      },
    };

    const response = await fetch("https://pay.genius.ci/api/v1/merchant/payments", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    let data: any = null;

    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return NextResponse.json(
        {
          message: `GeniusPay returned non-JSON response (HTTP ${response.status})`,
          provider_status: response.status,
        },
        { status: 502 },
      );
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          message:
            data?.error?.message || data?.message || "Payment initialization failed",
        },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        checkout_url: data.data.checkout_url || data.data.payment_url,
        payment_reference: data.data.reference,
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
