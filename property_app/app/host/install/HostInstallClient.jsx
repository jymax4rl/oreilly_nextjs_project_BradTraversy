"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import HostPwaInstallGuide from "@/components/host/HostPwaInstallGuide";
import usePwaInstall from "@/hooks/usePwaInstall";

function continueLabel(nextPath) {
  if (nextPath.startsWith("/host/onboarding")) return "Continue to application";
  if (nextPath.startsWith("/host/pending")) return "Continue to application status";
  if (nextPath.startsWith("/properties/add")) return "Continue to list a property";
  return "Continue";
}

export default function HostInstallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { installed } = usePwaInstall();
  const next = searchParams.get("next") || "/host/onboarding";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/host/onboarding";

  return (
    <section className="min-h-screen bg-[var(--kama-canvas)] px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--kama-accent)]">
            Become a host · Step 1
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--kama-ink)]">
            Install Isisel first
          </h1>
          <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
            Hosts use Isisel from the home screen — like an app — so listings and
            reservations are one tap away.
          </p>
        </div>

        <HostPwaInstallGuide
          variant="page"
          onDismiss={() => router.push(safeNext)}
        />

        <Link
          href={safeNext}
          className="kama-cta kama-focus-ring inline-flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold"
        >
          {continueLabel(safeNext)}
        </Link>

        {!installed ? (
          <p className="text-center text-xs text-[var(--kama-ink-muted)]">
            You can install now or continue and do it later from Profile →
            Install Isisel app.
          </p>
        ) : null}
      </div>
    </section>
  );
}
