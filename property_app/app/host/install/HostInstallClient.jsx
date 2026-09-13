"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import HostPwaInstallGuide from "@/components/host/HostPwaInstallGuide";
import usePwaInstall from "@/hooks/usePwaInstall";

function continueLabel(t, nextPath) {
  if (nextPath.startsWith("/host/onboarding")) return t("pwa.continueApply");
  if (nextPath.startsWith("/host/pending")) return t("pwa.continuePending");
  if (nextPath.startsWith("/properties/add")) return t("pwa.continueList");
  return t("pwa.continue");
}

export default function HostInstallClient() {
  const { t } = useLanguage();
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
            {t("pwa.pageKicker")}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--kama-ink)]">
            {t("pwa.pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
            {t("pwa.pageLede")}
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
          {continueLabel(t, safeNext)}
        </Link>

        {!installed ? (
          <p className="text-center text-xs text-[var(--kama-ink-muted)]">
            {t("pwa.laterHint")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
