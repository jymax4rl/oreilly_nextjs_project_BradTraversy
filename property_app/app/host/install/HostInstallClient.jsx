"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HostPwaInstallGuide from "@/components/host/HostPwaInstallGuide";

export default function HostInstallClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/host/pending";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/host/pending";

  return (
    <section className="min-h-[calc(100dvh-6rem)] bg-[var(--kama-canvas)] px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--kama-accent)]">
            Host setup
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--kama-ink)]">
            Install Isisel
          </h1>
          <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
            Treat hosting like a mobile app — open bookings and listings from
            your home screen.
          </p>
        </div>

        <HostPwaInstallGuide variant="page" />

        <Link
          href={safeNext}
          className="text-center text-sm font-medium text-[var(--kama-ink-muted)] underline-offset-2 hover:text-[var(--kama-accent)] hover:underline"
        >
          Skip for now
        </Link>
      </div>
    </section>
  );
}
