"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentSuccessBody() {
  const params = useSearchParams();
  const provider = params.get("provider") || "creem";
  const propertyId = params.get("property");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--kama-accent)]">
        Payment received
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--kama-ink)]">
        Your stay is being confirmed
      </h1>
      <p className="mt-4 text-[var(--kama-ink-muted)] leading-relaxed">
        {provider === "creem"
          ? "Card payment was submitted through Creem. You will get a confirmation email once the booking is finalized — usually within a few seconds."
          : provider === "geniuspay"
            ? "Mobile money payment was submitted through GeniusPay (Wave, Orange, MTN, Moov). You will get a confirmation email once the booking is finalized — usually within a few seconds."
            : "Payment was submitted. Check My Bookings for confirmation."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/my-bookings?confirmed=1"
          className="rounded-full bg-[var(--kama-accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          View my bookings
        </Link>
        {propertyId ? (
          <Link
            href={`/properties/${propertyId}`}
            className="rounded-full border border-[var(--kama-border)] px-5 py-3 text-sm font-semibold text-[var(--kama-ink)]"
          >
            Back to listing
          </Link>
        ) : null}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-center text-[var(--kama-ink-muted)]">
          Loading…
        </main>
      }
    >
      <PaymentSuccessBody />
    </Suspense>
  );
}
