"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostCalendarHubView({ properties }) {
  const { t } = useLanguage();

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          {t("hostConsole.calendar")}
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          {t("hostConsole.calendarBlurb")}
        </p>
      </header>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-[var(--kama-ink-muted)]">
            {t("hostConsole.calendarEmpty")}
          </p>
          <Link
            href="/properties/add"
            className="kama-cta mt-4 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
          >
            {t("hostConsole.listStay")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/properties/${p.id}/calendar`}
                className="block rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-5 transition hover:border-[var(--kama-border-strong)] hover:shadow-sm"
              >
                <p className="font-semibold text-[var(--kama-ink)]">{p.name}</p>
                {(p.city || p.country) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-[var(--kama-ink-muted)]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {[p.city, p.country].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="mt-3 text-xs font-semibold text-[var(--kama-accent)]">
                  {t("hostConsole.calendarOpen")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
