"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostPropertyToolChrome({
  backHref,
  backKey,
  eyebrowKey,
  name,
  locationLabel,
  imageSrc,
  policyHours,
  showListingTools = false,
  calendarHref,
  ratesHref,
  children,
}) {
  const { t } = useLanguage();

  const policySummary = policyHours
    ? [
        policyHours.allowGuestCancel
          ? t("hostConsole.policy.freeCancel", {
              hours: policyHours.freeCancelUntilHoursBeforeCheckIn,
            })
          : t("hostConsole.policy.noGuestCancel"),
        policyHours.allowGuestModify
          ? t("hostConsole.policy.dateChanges", {
              hours: policyHours.modifyUntilHoursBeforeCheckIn,
              max: policyHours.maxModifications,
            })
          : null,
      ]
        .filter(Boolean)
        .join(". ") + "."
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
      >
        <ArrowLeft size={18} aria-hidden />
        {t(backKey)}
      </Link>

      <div className="mb-6 flex gap-4 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4 shadow-sm">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--kama-field)]">
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--kama-accent)]">
            {t(eyebrowKey)}
          </p>
          <h1 className="mt-0.5 text-lg font-semibold leading-snug text-[var(--kama-ink)]">
            {name}
          </h1>
          {locationLabel ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--kama-ink-muted)]">
              <MapPin size={12} className="shrink-0" aria-hidden />
              {locationLabel}
            </p>
          ) : null}
          {policySummary ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              {policySummary}
            </p>
          ) : null}
          {showListingTools ? (
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
              <Link
                href={calendarHref}
                className="text-[var(--kama-accent)] hover:underline"
              >
                {t("hostConsole.calendar")}
              </Link>
              <Link
                href={ratesHref}
                className="text-[var(--kama-accent)] hover:underline"
              >
                {t("hostConsole.rates")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
