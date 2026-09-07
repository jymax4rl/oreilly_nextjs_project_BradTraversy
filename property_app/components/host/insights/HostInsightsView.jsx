"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import HostPageHeader from "@/components/host/HostPageHeader";
import "../home/host-home.css";

const RING_R = 27;
const RING_C = 2 * Math.PI * RING_R;
const RING_GAP = 11;
const RING_ARC = RING_C - RING_GAP;
const RANGE_OPTIONS = [7, 30, 90];

function formatMoneyCompact(amount, currency, locale) {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: currency || "USD",
      notation: Math.abs(n) >= 1000 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(n) >= 1000 ? 1 : 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function formatMoneyFull(amount, currency, locale) {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function InsightRing({ label, display, color, delay = 0, href, playId }) {
  const body = (
    <>
      <span className="relative inline-flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <circle
            key={playId}
            className="host-pulse-ring"
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray={`${RING_ARC} ${RING_GAP}`}
            style={{
              animationDelay: `${delay}ms`,
              "--ring-arc": RING_ARC,
            }}
          />
        </svg>
        <span
          key={`n-${playId}`}
          className="host-pulse-count max-w-[3.4rem] truncate text-center text-[0.95rem] font-semibold tabular-nums tracking-tight"
          style={{ color, animationDelay: `${delay + 80}ms` }}
        >
          {display}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--kama-ink)]">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        {label}
      </span>
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          aria-label={`${label}: ${display}`}
          className="group flex items-center gap-3 rounded-xl py-1 pr-2 transition hover:opacity-90"
        >
          {body}
        </Link>
      ) : (
        <div
          aria-label={`${label}: ${display}`}
          className="flex items-center gap-3 rounded-xl py-1 pr-2"
        >
          {body}
        </div>
      )}
    </li>
  );
}

export default function HostInsightsView({ insights }) {
  const { t, lang } = useLanguage();
  const locale = lang === "fr" ? "fr" : "en";
  const [playId, setPlayId] = useState(0);

  const range = insights?.rangeDays || 30;
  const currency = insights?.currency || "USD";

  useEffect(() => {
    setPlayId((n) => n + 1);
  }, [insights?.rangeDays, insights?.from]);

  const rangeLabel =
    range === 7
      ? t("hostConsole.insights.range7")
      : range === 90
        ? t("hostConsole.insights.range90")
        : t("hostConsole.insights.range30");

  if (!insights?.listings) {
    return (
      <div>
        <HostPageHeader
          titleKey="hostConsole.insights.title"
          blurbKey="hostConsole.insights.blurb"
        />
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--kama-ink)]">
            {t("hostConsole.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--kama-ink-muted)]">
            {t("hostConsole.emptyHint")}
          </p>
          <Link
            href="/properties/add"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--kama-accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)]"
          >
            {t("hostConsole.listProperty")}
          </Link>
        </div>
      </div>
    );
  }

  const detailRows = [
    {
      key: "net",
      label: t("hostConsole.insights.net"),
      value: formatMoneyFull(insights.earnings.net, currency, locale),
    },
    {
      key: "waived",
      label: t("hostConsole.insights.waived"),
      value: formatMoneyFull(insights.earnings.waived, currency, locale),
    },
    {
      key: "nights",
      label: t("hostConsole.insights.nights"),
      value: `${insights.occupancy.bookedNights} / ${insights.occupancy.availableNights}`,
    },
  ];

  return (
    <div>
      <HostPageHeader
        titleKey="hostConsole.insights.title"
        blurbKey="hostConsole.insights.blurb"
      />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--kama-ink-muted)]">{rangeLabel}</p>
        <div
          className="inline-flex rounded-xl border border-[var(--kama-border-strong)] bg-white p-0.5"
          role="group"
          aria-label={t("hostConsole.insights.rangeAria")}
        >
          {RANGE_OPTIONS.map((days) => {
            const active = days === range;
            return (
              <Link
                key={days}
                href={`/host/insights?range=${days}`}
                className={
                  active
                    ? "rounded-lg bg-[var(--kama-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
                }
                aria-current={active ? "page" : undefined}
              >
                {t(`hostConsole.insights.range${days}`)}
              </Link>
            );
          })}
        </div>
      </header>

      <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
        <InsightRing
          label={t("hostConsole.insights.gross")}
          display={formatMoneyCompact(insights.earnings.gross, currency, locale)}
          color="var(--kama-accent)"
          delay={0}
          playId={playId}
          href="/host/reservations"
        />
        <InsightRing
          label={t("hostConsole.insights.bookings")}
          display={String(insights.bookings.confirmed)}
          color="var(--kama-ink)"
          delay={90}
          playId={playId}
          href="/host/reservations"
        />
        <InsightRing
          label={t("hostConsole.insights.occupancy")}
          display={`${insights.occupancy.pct}%`}
          color="var(--kama-ink-muted)"
          delay={180}
          playId={playId}
          href="/host/calendar"
        />
        <InsightRing
          label={t("hostConsole.insights.adr")}
          display={formatMoneyCompact(insights.adr, currency, locale)}
          color="var(--kama-accent)"
          delay={270}
          playId={playId}
        />
      </ul>

      <ul className="mt-8 overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)]">
        {detailRows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-3 border-b border-[var(--kama-border)] px-4 py-3 last:border-b-0"
          >
            <span className="text-sm text-[var(--kama-ink-muted)]">{row.label}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
          {t("hostConsole.insights.today")}
        </h2>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <InsightRing
            label={t("hostConsole.homeArriving")}
            display={String(insights.today.arriving)}
            color="var(--kama-accent)"
            delay={0}
            playId={`t-${playId}`}
            href="/host/calendar"
          />
          <InsightRing
            label={t("hostConsole.homeDeparting")}
            display={String(insights.today.departing)}
            color="var(--kama-ink-muted)"
            delay={90}
            playId={`t-${playId}`}
            href="/host/calendar"
          />
          <InsightRing
            label={t("hostConsole.homeInStay")}
            display={String(insights.today.inStay)}
            color="var(--kama-ink)"
            delay={180}
            playId={`t-${playId}`}
            href="/host/calendar"
          />
          <InsightRing
            label={t("hostConsole.insights.pending")}
            display={String(insights.today.pending)}
            color={
              insights.today.pending
                ? "var(--kama-danger)"
                : "var(--kama-ink-muted)"
            }
            delay={270}
            playId={`t-${playId}`}
            href="/host/reservations"
          />
        </ul>
      </section>

      {insights.byListing?.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
            {t("hostConsole.insights.byListing")}
          </h2>
          <ul className="overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)]">
            {insights.byListing.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--kama-border)] px-4 py-3 last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--kama-ink)]">
                    {row.name}
                  </span>
                  <span className="text-xs text-[var(--kama-ink-muted)]">
                    {t("hostConsole.insights.listingMeta", {
                      bookings: row.bookings,
                      nights: row.nights,
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                  {formatMoneyFull(row.gross, currency, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
