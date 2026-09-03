"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostHomeView({
  stats,
  pendingBookings,
  upcomingStays,
}) {
  const { t } = useLanguage();

  const statMeta = [
    { key: "listings", labelKey: "hostConsole.listingsStat", href: "/host/listings" },
    {
      key: "awaiting",
      labelKey: "hostConsole.awaitingReview",
      href: "/host/listings",
    },
    {
      key: "requests",
      labelKey: "hostConsole.reservationRequests",
      href: "/host/reservations",
    },
    {
      key: "unread",
      labelKey: "hostConsole.unreadMessages",
      href: "/host/messages",
    },
  ];

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          {t("hostConsole.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          {t("hostConsole.blurb")}
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statMeta.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-4 transition hover:border-[var(--kama-border-strong)] hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
                {t(item.labelKey)}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--kama-ink)]">
                {stats[item.key]}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
              {t("hostConsole.requests")}
            </h2>
            <Link
              href="/host/reservations"
              className="text-xs font-semibold text-[var(--kama-accent)] hover:underline"
            >
              {t("hostConsole.allReservations")}
            </Link>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              {t("hostConsole.noRequests")}
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingBookings.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--kama-ink)]">
                    {b.propertyName || t("hostConsole.stay")}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                    {b.guestName || t("hostConsole.guest")} · {b.checkIn} →{" "}
                    {b.checkOut}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
              {t("hostConsole.upcomingArrivals")}
            </h2>
            <Link
              href="/host/calendar"
              className="text-xs font-semibold text-[var(--kama-accent)] hover:underline"
            >
              {t("hostConsole.calendar")}
            </Link>
          </div>
          {upcomingStays.length === 0 ? (
            <p className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              {t("hostConsole.noUpcoming")}
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingStays.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--kama-ink)]">
                    {b.propertyName || t("hostConsole.stay")}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                    {b.checkIn} · {b.status}
                    {b.guestName ? ` · ${b.guestName}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
