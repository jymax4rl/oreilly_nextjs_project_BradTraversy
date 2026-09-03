"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { bookingMatchesSearch } from "@/utils/bookings/bookingRefSearch";
import {
  assignLanes,
  barGeometry,
  displayStatus,
  eachDayInclusive,
  firstName,
  formatDayHead,
  formatRangeLabel,
  localTodayYmd,
  monthPreset,
  rangeForView,
  shiftRange,
  weekPreset,
  countNights,
  addDaysYmd,
} from "@/utils/host/reservationsCalendar";
import GuestAvatar from "./GuestAvatar";
import ReservationDrawer from "./ReservationDrawer";
import "./reservations-calendar.css";

const DAY_PX = 56;
const LANE_H = 38;
const ROW_PAD = 10;

function isWeekend(ymd) {
  const day = new Date(`${ymd}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

export default function HostReservationsCalendar({ initialProperties = [] }) {
  const { t, lang } = useLanguage();
  const today = localTodayYmd();
  const [view, setView] = useState("timeline");
  const [from, setFrom] = useState(() => rangeForView("timeline", today).from);
  const [to, setTo] = useState(() => rangeForView("timeline", today).to);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [q, setQ] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState(initialProperties);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const scrollRef = useRef(null);
  const barRefs = useRef(new Map());
  const centeredToday = useRef(false);
  const pendingToday = useRef(false);
  const filtersRef = useRef(null);

  const days = useMemo(() => eachDayInclusive(from, to), [from, to]);
  const locale = lang === "fr" ? "fr" : "en";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        status: "all",
        from,
        to,
      });
      const res = await fetch(`/api/host/reservations?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.resCal.loadFailed"));
      setBookings(data.bookings || []);
      if (Array.isArray(data.properties) && data.properties.length) {
        setProperties(data.properties);
      }
    } catch (e) {
      setError(e.message || t("hostConsole.resCal.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [from, to, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (propertyId && String(b.propertyId) !== propertyId) return false;
      const vis = displayStatus(b, today);
      const listed = b.listed !== false;
      if (!listed && !q.trim() && status !== "unlisted") return false;
      if (status === "unlisted") return !listed && vis !== "cancelled";
      if (status !== "all" && vis !== status) return false;
      if (q.trim() && !bookingMatchesSearch(b, q)) return false;
      return true;
    });
  }, [bookings, propertyId, status, q, today]);

  const hits = useMemo(() => {
    if (!q.trim()) return new Set();
    return new Set(filtered.map((b) => b._id));
  }, [filtered, q]);

  const byProperty = useMemo(() => {
    const map = new Map(properties.map((p) => [p.id, []]));
    for (const b of filtered) {
      const id = String(b.propertyId);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(b);
    }
    return map;
  }, [properties, filtered]);

  const rows = useMemo(() => {
    const list = propertyId
      ? properties.filter((p) => p.id === propertyId)
      : properties;
    return list.map((property) => {
      const placed = assignLanes(byProperty.get(property.id) || []);
      const lanes = placed.reduce((n, b) => Math.max(n, b.lane + 1), 0);
      return { property, placed, lanes: Math.max(1, lanes) };
    });
  }, [properties, propertyId, byProperty]);

  const selected = bookings.find((b) => b._id === selectedId) || null;

  const scrollToToday = useCallback(() => {
    const node = scrollRef.current;
    if (!node || !days.length) return;
    const idx = days.indexOf(today);
    if (idx < 0) return;
    const left = Math.max(0, idx * DAY_PX - node.clientWidth * 0.35);
    node.scrollTo({ left, behavior: "smooth" });
  }, [days, today]);

  useEffect(() => {
    if (loading || centeredToday.current) return;
    scrollToToday();
    centeredToday.current = true;
  }, [loading, scrollToToday]);

  useEffect(() => {
    if (!pendingToday.current || loading) return;
    scrollToToday();
    pendingToday.current = false;
  }, [from, to, loading, scrollToToday]);

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onDoc = (e) => {
      if (!filtersRef.current?.contains(e.target)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filtersOpen]);

  useEffect(() => {
    if (!q.trim() || !hits.size) return;
    const first = filtered[0];
    if (!first) return;
    const el = barRefs.current.get(first._id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [q, hits, filtered]);

  const goView = (next) => {
    setView(next);
    const range = rangeForView(next, today);
    setFrom(range.from);
    setTo(range.to);
  };

  const goToday = () => {
    pendingToday.current = true;
    const range = rangeForView(view, today);
    setFrom(range.from);
    setTo(range.to);
  };

  const applyCustom = () => {
    const start = customFrom || from;
    const end = customTo || to;
    if (!start || !end || start > end) return;
    const span = eachDayInclusive(start, end).length;
    setView("timeline");
    setFrom(start);
    setTo(span > 180 ? addDaysYmd(start, 179) : end);
  };

  const todayLeft = days.indexOf(today);

  return (
    <div className="rc" style={{ "--rc-day": `${DAY_PX}px`, "--rc-days": days.length }}>
      <header className="mb-5 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
          {t("hostConsole.badge")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          {t("hostConsole.resCal.title")}
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          {t("hostConsole.resCal.blurb")}{" "}
          <Link
            href="/host/calendar"
            className="font-semibold text-[var(--kama-accent)] hover:underline"
          >
            {t("hostConsole.calendar")}
          </Link>
        </p>
      </header>

      <div className="rc-toolbar">
        <div className="rc-toolbar__row">
          <label className="rc-search">
            <Search className="h-4 w-4 shrink-0 text-[var(--kama-ink-muted)]" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("hostConsole.resCal.searchPh")}
              aria-label={t("hostConsole.resCal.searchPh")}
            />
          </label>
          <div className="rc-pop" ref={filtersRef}>
            <button
              type="button"
              className="rc-btn"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              {t("hostConsole.resCal.filters")}
            </button>
            {filtersOpen ? (
              <div className="rc-pop__panel">
                <label>
                  {t("hostConsole.resCal.property")}
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                  >
                    <option value="">{t("hostConsole.resCal.allProperties")}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("hostConsole.resCal.statusLabel")}
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">{t("hostConsole.resCal.status.all")}</option>
                    <option value="confirmed">{t("hostConsole.resCal.status.confirmed")}</option>
                    <option value="pending">{t("hostConsole.resCal.status.pending")}</option>
                    <option value="cancelled">{t("hostConsole.resCal.status.cancelled")}</option>
                    <option value="completed">{t("hostConsole.resCal.status.completed")}</option>
                    <option value="unlisted">{t("hostConsole.resCal.status.unlisted")}</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rc-toolbar__row">
          <button type="button" className="rc-btn" onClick={() => {
            const next = shiftRange(from, to, view, -1);
            setFrom(next.from);
            setTo(next.to);
          }}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t("hostConsole.resCal.prev")}</span>
          </button>
          <button type="button" className="rc-btn rc-btn--accent" onClick={goToday}>
            {t("hostConsole.resCal.today")}
          </button>
          <button type="button" className="rc-btn" onClick={() => {
            const next = shiftRange(from, to, view, 1);
            setFrom(next.from);
            setTo(next.to);
          }}>
            <span className="hidden sm:inline">{t("hostConsole.resCal.next")}</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <p className="rc-range">{formatRangeLabel(from, to, locale)}</p>
          <div className="rc-seg" role="group" aria-label={t("hostConsole.resCal.view")}>
            {[
              ["timeline", t("hostConsole.resCal.views.timeline")],
              ["week", t("hostConsole.resCal.views.week")],
              ["month", t("hostConsole.resCal.views.month")],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => goView(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rc-toolbar__row rc-presets">
          <button type="button" className="rc-btn rc-btn--ghost" onClick={goToday}>
            {t("hostConsole.resCal.presets.today")}
          </button>
          <button
            type="button"
            className="rc-btn rc-btn--ghost"
            onClick={() => {
              const r = weekPreset();
              setView("week");
              setFrom(r.from);
              setTo(r.to);
            }}
          >
            {t("hostConsole.resCal.presets.week")}
          </button>
          <button
            type="button"
            className="rc-btn rc-btn--ghost"
            onClick={() => {
              const r = monthPreset("this");
              setView("month");
              setFrom(r.from);
              setTo(r.to);
            }}
          >
            {t("hostConsole.resCal.presets.month")}
          </button>
          <button
            type="button"
            className="rc-btn rc-btn--ghost"
            onClick={() => {
              const r = monthPreset("next");
              setView("month");
              setFrom(r.from);
              setTo(r.to);
            }}
          >
            {t("hostConsole.resCal.presets.nextMonth")}
          </button>
          <div className="rc-dates">
            <input
              type="date"
              value={customFrom || from}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label={t("hostConsole.resCal.from")}
            />
            <input
              type="date"
              value={customTo || to}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label={t("hostConsole.resCal.to")}
            />
            <button type="button" className="rc-btn" onClick={applyCustom}>
              {t("hostConsole.resCal.applyRange")}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="rc-err">{error}</p> : null}
      {loading ? <div className="rc-skel" aria-hidden /> : null}

      {!loading && properties.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-[var(--kama-ink-muted)]">{t("hostConsole.calendarEmpty")}</p>
          <Link
            href="/properties/add"
            className="kama-cta mt-4 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
          >
            {t("hostConsole.listStay")}
          </Link>
        </div>
      ) : null}

      {!loading && properties.length > 0 ? (
        <div className="rc-board">
          <div className="rc-scroll" ref={scrollRef}>
            <div className="rc-grid">
              <div className="rc-head">
                <div className="rc-corner">{t("hostConsole.resCal.property")}</div>
                <div className="rc-days">
                  {days.map((ymd) => {
                    const head = formatDayHead(ymd, locale);
                    return (
                      <div
                        key={ymd}
                        className="rc-day"
                        data-today={ymd === today ? "true" : "false"}
                        data-weekend={isWeekend(ymd) ? "true" : "false"}
                      >
                        <span className="rc-day__wk">{head.wk}</span>
                        <span className="rc-day__num">{head.num}</span>
                        <span className="rc-day__mon">{head.mon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {rows.map(({ property, placed, lanes }) => (
                <div
                  key={property.id}
                  className="rc-row"
                  style={{ minHeight: `${ROW_PAD * 2 + lanes * LANE_H}px` }}
                >
                  <div className="rc-prop">
                    <div className="min-w-0">
                      <p className="rc-prop__name">{property.name}</p>
                      {(property.city || property.country) && (
                        <p className="rc-prop__meta">
                          {[property.city, property.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <Link
                        href={`/properties/${property.id}/calendar`}
                        className="rc-prop__meta mt-0.5 inline-flex items-center gap-1 text-[var(--kama-accent)]"
                      >
                        <CalendarRange className="h-3 w-3" aria-hidden />
                        {t("hostConsole.availabilityCalendar")}
                      </Link>
                    </div>
                  </div>
                  <div
                    className="rc-track"
                    style={{ minHeight: `${ROW_PAD * 2 + lanes * LANE_H}px` }}
                  >
                    <div className="rc-cols" aria-hidden>
                      {days.map((ymd) => (
                        <div
                          key={ymd}
                          className="rc-col"
                          data-today={ymd === today ? "true" : "false"}
                        />
                      ))}
                    </div>
                    {todayLeft >= 0 ? (
                      <div
                        className="rc-today"
                        data-label={t("hostConsole.resCal.todayMark")}
                        style={{ left: todayLeft * DAY_PX + DAY_PX / 2 }}
                      />
                    ) : null}
                    {placed.length === 0 ? (
                      <p className="rc-empty">{t("hostConsole.resCal.noReservations")}</p>
                    ) : (
                      placed.map((booking) => {
                        const geo = barGeometry(booking, days, DAY_PX);
                        if (!geo) return null;
                        const vis = displayStatus(booking, today);
                        const nights = countNights(booking.checkIn, booking.checkOut);
                        return (
                          <button
                            key={booking._id}
                            type="button"
                            className="rc-bar"
                            data-status={vis}
                            data-on={selectedId === booking._id ? "true" : "false"}
                            data-hit={hits.has(booking._id) ? "true" : "false"}
                            ref={(el) => {
                              if (el) barRefs.current.set(booking._id, el);
                              else barRefs.current.delete(booking._id);
                            }}
                            style={{
                              left: geo.left + 4,
                              width: Math.max(48, geo.width - 8),
                              top: ROW_PAD + booking.lane * LANE_H,
                            }}
                            onClick={() => setSelectedId(booking._id)}
                          >
                            <GuestAvatar
                              name={booking.guestName}
                              src={booking.guestImage}
                            />
                            <span className="rc-bar__meta">
                              <span className="rc-bar__name">
                                {firstName(booking.guestName) || t("hostConsole.guest")}
                              </span>
                              <span className="rc-bar__sub">
                                <span className="rc-dot" data-status={vis} />
                                {t(
                                  nights === 1
                                    ? "hostConsole.bookings.nightOne"
                                    : "hostConsole.bookings.nightOther",
                                  { n: nights },
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <ReservationDrawer
          booking={selected}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      ) : null}
    </div>
  );
}
