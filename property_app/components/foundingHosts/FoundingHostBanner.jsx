"use client";

import Link from "next/link";
import FoundingHostBadge from "@/components/foundingHosts/FoundingHostBadge";

function formatUntil(iso, locale) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function FoundingHostBanner({ foundingHost, t, locale }) {
  if (!foundingHost?.isFoundingHost) return null;

  const until = formatUntil(foundingHost.expiresAt, locale);
  const active = Boolean(foundingHost.commissionActive);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)]">
      <div className="h-1 bg-[linear-gradient(90deg,var(--kama-accent),#2a7a73)]" />
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <FoundingHostBadge number={foundingHost.number} />
          <p className="text-sm font-semibold tracking-tight text-[var(--kama-ink)]">
            {t("hostConsole.founding.title")}
          </p>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          {active
            ? t("hostConsole.founding.commissionOn")
            : t("hostConsole.founding.commissionOff")}
        </p>
        {until ? (
          <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
            {active
              ? t("hostConsole.founding.until", { date: until })
              : t("hostConsole.founding.ended", { date: until })}
          </p>
        ) : null}
        <Link
          href="/founding-hosts"
          className="mt-3 inline-flex text-xs font-semibold text-[var(--kama-accent)] hover:underline"
        >
          {t("hostConsole.founding.learnMore")}
        </Link>
      </div>
    </section>
  );
}
