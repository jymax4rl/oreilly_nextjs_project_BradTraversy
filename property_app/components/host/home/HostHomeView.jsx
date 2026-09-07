"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  addDaysYmd,
  localTodayYmd,
} from "@/utils/host/reservationsCalendar";
import FoundingHostBanner from "@/components/foundingHosts/FoundingHostBanner";
import "./host-home.css";

function shortDate(ymd, locale) {
  if (!ymd) return "";
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function initials(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

const RING_R = 27;
const RING_C = 2 * Math.PI * RING_R;
const RING_GAP = 11;
const RING_ARC = RING_C - RING_GAP;

function PulseRing({ href, label, value, color, playId, delay = 0 }) {
  const count = Number(value) || 0;
  return (
    <li>
      <Link
        href={href}
        aria-label={`${label}: ${count}`}
        className="group flex items-center gap-3 rounded-xl py-1 pr-2 transition hover:opacity-90"
      >
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
            className="host-pulse-count text-[1.35rem] font-semibold tabular-nums tracking-tight"
            style={{ color, animationDelay: `${delay + 80}ms` }}
          >
            {count}
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
      </Link>
    </li>
  );
}

function StayRow({ href, booking, t, locale, badge }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 transition hover:border-[var(--kama-border-strong)]"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--kama-accent-soft)] text-xs font-semibold text-[var(--kama-accent)]">
          {initials(booking.guestName || t("hostConsole.guest"))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--kama-ink)]">
              {booking.guestName || t("hostConsole.guest")}
            </span>
            {badge ? (
              <span className="shrink-0 rounded-full bg-[var(--kama-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-accent)]">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[var(--kama-ink-muted)]">
            {booking.propertyName || t("hostConsole.stay")} ·{" "}
            {shortDate(booking.checkIn, locale)}
            {booking.checkOut ? ` – ${shortDate(booking.checkOut, locale)}` : ""}
          </span>
        </span>
      </Link>
    </li>
  );
}

function isLiveStay(booking) {
  if (!booking || booking.listed === false) return false;
  return booking.status === "pending" || booking.status === "confirmed";
}

function homePulse(stays, unread, awaiting) {
  const today = localTodayYmd();
  const weekEnd = addDaysYmd(today, 7);
  const active = (stays || []).filter(isLiveStay);
  const pendingAll = active.filter((b) => b.status === "pending");
  const arriving = active.filter((b) => b.checkIn === today);
  const upcomingStays = active
    .filter((b) => b.checkIn >= today && b.checkIn <= weekEnd)
    .slice(0, 6);
  const upcomingIds = new Set(upcomingStays.map((b) => b.id));
  const inStay = active.filter(
    (b) =>
      b.status === "confirmed" && b.checkIn < today && b.checkOut > today,
  );
  const departing = active.filter(
    (b) => b.status === "confirmed" && b.checkOut === today,
  );
  const pendingBookings = pendingAll
    .filter((b) => !upcomingIds.has(b.id))
    .slice(0, 6);

  return {
    inStay: inStay.length,
    arriving: arriving.length,
    departing: departing.length,
    requests: pendingAll.length,
    open: pendingAll.length + unread + awaiting,
    pendingBookings,
    upcomingStays,
  };
}

export default function HostHomeView({
  listings = 0,
  unread = 0,
  awaiting = 0,
  stays = [],
  foundingHost = null,
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [playId, setPlayId] = useState(0);
  const locale = lang === "fr" ? "fr" : "en";
  const pulse = homePulse(stays, unread, awaiting);
  const openHref = pulse.requests
    ? "/host/reservations"
    : unread
      ? "/host/messages"
      : awaiting
        ? "/host/listings"
        : "/host/reservations";

  useEffect(() => {
    function replay() {
      setPlayId((n) => n + 1);
    }
    window.addEventListener("kama-host-home-replay", replay);
    return () => window.removeEventListener("kama-host-home-replay", replay);
  }, []);

  async function refreshHome() {
    setPlayId((n) => n + 1);
    setRefreshing(true);
    try {
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setRefreshing(false);
    }
  }

  if (!listings) {
    return (
      <div>
        <FoundingHostBanner
          foundingHost={foundingHost}
          t={t}
          locale={locale}
        />
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          {t("hostConsole.blurb")}
        </p>
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--kama-ink)]">
            {t("hostConsole.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--kama-ink-muted)]">
            {t("hostConsole.emptyHint")}
          </p>
          <Link
            href="/properties/add"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--kama-accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("hostConsole.listProperty")}
          </Link>
        </div>
      </div>
    );
  }

  const cues = [
    awaiting
      ? {
          href: "/host/listings",
          label: t("hostConsole.homeCues.review", { n: awaiting }),
        }
      : null,
    unread
      ? {
          href: "/host/messages",
          label: t("hostConsole.unreadCount", { n: unread }),
        }
      : null,
  ].filter(Boolean);

  return (
    <div>
      <FoundingHostBanner
        foundingHost={foundingHost}
        t={t}
        locale={locale}
      />
      <header className="mb-8 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--kama-ink-muted)]">
          {listings === 1
            ? t("hostConsole.homePulseOne")
            : t("hostConsole.homePulse", { n: listings })}
        </p>
        <button
          type="button"
          onClick={refreshHome}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-border-strong)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)] disabled:opacity-60"
          aria-label={t("hostConsole.homeRefreshAria")}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : undefined}
            aria-hidden
          />
          {refreshing
            ? t("hostConsole.homeRefreshing")
            : t("hostConsole.homeRefresh")}
        </button>
      </header>

      <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
        <PulseRing
          href="/host/calendar"
          label={t("hostConsole.homeArriving")}
          value={pulse.arriving}
          color="var(--kama-accent)"
          playId={playId}
          delay={0}
        />
        <PulseRing
          href="/host/calendar"
          label={t("hostConsole.homeDeparting")}
          value={pulse.departing}
          color="var(--kama-ink-muted)"
          playId={playId}
          delay={90}
        />
        <PulseRing
          href="/host/calendar"
          label={t("hostConsole.homeInStay")}
          value={pulse.inStay}
          color="var(--kama-ink)"
          playId={playId}
          delay={180}
        />
        <PulseRing
          href={openHref}
          label={t("hostConsole.homeNeedsYou")}
          value={pulse.open}
          color={
            pulse.open ? "var(--kama-danger)" : "var(--kama-ink-muted)"
          }
          playId={playId}
          delay={270}
        />
      </ul>

      {cues.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {cues.map((cue) => (
            <li key={cue.href}>
              <Link
                href={cue.href}
                className="inline-flex rounded-full bg-[var(--kama-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-glow)]"
              >
                {cue.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

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
          {pulse.pendingBookings.length === 0 ? (
            <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              {t("hostConsole.noRequests")}
            </p>
          ) : (
            <ul className="space-y-2">
              {pulse.pendingBookings.map((b) => (
                <StayRow
                  key={b.id}
                  href="/host/reservations"
                  booking={b}
                  t={t}
                  locale={locale}
                  badge={t("hostConsole.homeRequestBadge")}
                />
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
          {pulse.upcomingStays.length === 0 ? (
            <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              {t("hostConsole.noUpcoming")}
            </p>
          ) : (
            <ul className="space-y-2">
              {pulse.upcomingStays.map((b) => (
                <StayRow
                  key={b.id}
                  href={
                    b.status === "pending"
                      ? "/host/reservations"
                      : "/host/calendar"
                  }
                  booking={b}
                  t={t}
                  locale={locale}
                  badge={
                    b.status === "pending"
                      ? t("hostConsole.homeRequestBadge")
                      : null
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
