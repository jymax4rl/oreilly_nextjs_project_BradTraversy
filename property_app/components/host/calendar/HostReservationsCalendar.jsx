"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { bookingMatchesSearch } from "@/utils/bookings/bookingRefSearch";
import {
  assignLanes,
  barGeometry,
  displayStatus,
  pillStatus,
  eachDayInclusive,
  firstName,
  formatDayHead,
  formatRangeLabel,
  localTodayYmd,
  monthPreset,
  rangeForView,
  shiftRange,
  weekPreset,
  addDaysYmd,
  countNights,
} from "@/utils/host/reservationsCalendar";
import GuestAvatar from "./GuestAvatar";
import ReservationDrawer from "./ReservationDrawer";
import MoveStayConfirm from "./MoveStayConfirm";
import { propertyImageUrl } from "@/utils/propertyImageUrl";
import "./reservations-calendar.css";

const DAY_PX = 56;
const LANE_H = 44;
const ROW_PAD = 12;
const DRAG_PX = 10;
const PILL_TONES = [
  "upcoming",
  "current",
  "modified",
  "pending",
  "past",
  "cancelled",
];

function useDayPx() {
  const [px, setPx] = useState(DAY_PX);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPx(mq.matches ? 44 : DAY_PX);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return px;
}

function isWeekend(ymd) {
  const day = new Date(`${ymd}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function stayDraggable(booking, { today, propertyFilter, propertyCount }) {
  if (propertyFilter) return false;
  if (propertyCount < 2) return false;
  if (!booking || booking.listed === false) return false;
  if (booking.status === "cancelled") return false;
  if (displayStatus(booking, today) === "completed") return false;
  if (booking.actions?.modify?.allowed === false) return false;
  if (booking.checkIn < today) return false;
  return true;
}

function stayResizable(booking, today) {
  if (!booking || booking.listed === false) return false;
  if (booking.status === "cancelled") return false;
  if (displayStatus(booking, today) === "completed") return false;
  if (booking.actions?.modify?.allowed === false) return false;
  return true;
}

function clampResize({ edge, origIn, origOut, deltaDays, today }) {
  if (edge === "start") {
    let checkIn = addDaysYmd(origIn, deltaDays);
    const latest = addDaysYmd(origOut, -1);
    if (checkIn > latest) checkIn = latest;
    if (origIn >= today && checkIn < today) checkIn = today;
    return { checkIn, checkOut: origOut };
  }
  let checkOut = addDaysYmd(origOut, deltaDays);
  const earliest = addDaysYmd(origIn, 1);
  if (checkOut < earliest) checkOut = earliest;
  return { checkIn: origIn, checkOut };
}

export default function HostReservationsCalendar({ initialProperties = [] }) {
  const { t, lang } = useLanguage();
  const today = localTodayYmd();
  const dayPx = useDayPx();
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
  const [draggingId, setDraggingId] = useState("");
  const [dragOverId, setDragOverId] = useState("");
  const [pendingMove, setPendingMove] = useState(null);
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [resizePreview, setResizePreview] = useState(null);
  const [resizeError, setResizeError] = useState("");
  const scrollRef = useRef(null);
  const barRefs = useRef(new Map());
  const centeredToday = useRef(false);
  const pendingToday = useRef(false);
  const dragRef = useRef(null);
  const dragOverRef = useRef("");
  const suppressClickRef = useRef(false);
  const propertiesRef = useRef(initialProperties);
  const todayRef = useRef(today);
  const dayPxRef = useRef(dayPx);
  const saveResizeRef = useRef(async () => {});
  const mobileRangeOnce = useRef(false);

  const days = useMemo(() => eachDayInclusive(from, to), [from, to]);
  const locale = lang === "fr" ? "fr" : "en";
  const filterCount = Number(Boolean(propertyId)) + Number(status !== "all");
  const showLegend = !loading && properties.length > 0;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }, [from, to, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (mobileRangeOnce.current) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    mobileRangeOnce.current = true;
    setFrom(addDaysYmd(today, -1));
    setTo(addDaysYmd(today, 12));
  }, [today]);

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

  propertiesRef.current = properties;
  todayRef.current = today;
  dayPxRef.current = dayPx;

  const selected = bookings.find((b) => b._id === selectedId) || null;

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.type === "resize") {
        const dist = Math.abs(e.clientX - d.x);
        if (!d.active && dist < 3) return;
        d.active = true;
        suppressClickRef.current = true;
        const deltaDays = Math.round((e.clientX - d.x) / dayPxRef.current);
        const next = clampResize({
          edge: d.edge,
          origIn: d.origIn,
          origOut: d.origOut,
          deltaDays,
          today: todayRef.current,
        });
        if (d.previewIn === next.checkIn && d.previewOut === next.checkOut) return;
        d.previewIn = next.checkIn;
        d.previewOut = next.checkOut;
        setResizePreview({
          id: d.booking._id,
          checkIn: next.checkIn,
          checkOut: next.checkOut,
        });
        return;
      }
      const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (!d.active && dist < DRAG_PX) return;
      if (!d.active) {
        d.active = true;
        suppressClickRef.current = true;
        setDraggingId(d.booking._id);
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest?.("[data-property-id]");
      const over = row?.getAttribute("data-property-id") || "";
      if (dragOverRef.current !== over) {
        dragOverRef.current = over;
        setDragOverId(over);
      }
    };
    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      const over = dragOverRef.current;
      const wasActive = d.active;
      const booking = d.booking;
      dragRef.current = null;
      dragOverRef.current = "";
      setDraggingId("");
      setDragOverId("");
      if (d.type === "resize") {
        const changed =
          wasActive &&
          (d.previewIn !== d.origIn || d.previewOut !== d.origOut);
        if (changed) {
          void saveResizeRef.current(booking, d.previewIn, d.previewOut);
        } else {
          setResizePreview(null);
        }
      } else {
        setResizePreview(null);
        if (wasActive && over && over !== String(booking.propertyId)) {
          const list = propertiesRef.current || [];
          const dest = list.find((p) => p.id === over);
          const source = list.find((p) => p.id === String(booking.propertyId));
          if (dest) {
            setSelectedId(null);
            setMoveError("");
            setPendingMove({ booking, from: source, to: dest });
          }
        }
      }
      if (wasActive) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const confirmPendingMove = async () => {
    if (!pendingMove?.booking || !pendingMove?.to) return;
    setMoveBusy(true);
    setMoveError("");
    try {
      const booking = pendingMove.booking;
      const res = await fetch(
        `/api/properties/${booking.propertyId}/bookings/${booking._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetPropertyId: pendingMove.to.id,
            version: booking.version,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("hostConsole.resCal.couldNotMove"));
      }
      setPendingMove(null);
      setSelectedId(booking._id);
      await load({ silent: true });
    } catch (e) {
      setMoveError(e.message || t("hostConsole.resCal.couldNotMove"));
    } finally {
      setMoveBusy(false);
    }
  };

  saveResizeRef.current = async (booking, checkIn, checkOut) => {
    const id = booking._id;
    const revertIn = booking.checkIn;
    const revertOut = booking.checkOut;
    setResizeError("");
    setBookings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, checkIn, checkOut } : b)),
    );
    setResizePreview(null);
    try {
      const res = await fetch(
        `/api/properties/${booking.propertyId}/bookings/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkIn, checkOut }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t("hostConsole.bookings.couldNotUpdateDates"),
        );
      }
      const saved = data.booking;
      if (saved) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b._id !== id) return b;
            return {
              ...b,
              ...saved,
              _id: id,
              propertyId: saved.propertyId
                ? String(saved.propertyId)
                : b.propertyId,
            };
          }),
        );
      }
    } catch (e) {
      setBookings((prev) =>
        prev.map((b) =>
          b._id === id ? { ...b, checkIn: revertIn, checkOut: revertOut } : b,
        ),
      );
      setResizeError(e.message || t("hostConsole.bookings.couldNotUpdateDates"));
    }
  };

  const scrollToToday = useCallback(() => {
    const node = scrollRef.current;
    if (!node || !days.length) return;
    const idx = days.indexOf(today);
    if (idx < 0) return;
    const left = Math.max(0, idx * dayPx - node.clientWidth * 0.35);
    node.scrollTo({ left, behavior: "smooth" });
  }, [days, today, dayPx]);

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
    const onKey = (e) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
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
    <div className="rc" style={{ "--rc-day": `${dayPx}px`, "--rc-days": days.length }}>
      <header className="rc-pagehead">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
          {t("hostConsole.badge")}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-2xl">
          {t("hostConsole.calendar")}
        </h1>
        <p className="rc-pagehead__blurb mt-2 text-sm text-[var(--kama-ink-muted)]">
          {t("hostConsole.calendarBlurb")}
        </p>
      </header>

      <div className="rc-toolbar">
        <div className="rc-chrome">
          <div className="rc-search">
            <Search className="h-4 w-4 shrink-0 text-[var(--kama-ink-muted)]" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("hostConsole.resCal.searchPh")}
              aria-label={t("hostConsole.resCal.searchPh")}
            />
            {q ? (
              <button
                type="button"
                className="rc-search__clear"
                aria-label={t("hostConsole.resCal.close")}
                onClick={() => setQ("")}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className="rc-search__filter"
              data-on={filterCount > 0 ? "true" : "false"}
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              aria-label={t("hostConsole.resCal.filters")}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              {filterCount > 0 ? <span className="rc-search__badge">{filterCount}</span> : null}
            </button>
          </div>

          <div className="rc-chrome__rule" aria-hidden />

          <div className="rc-chrono">
            <button
              type="button"
              className="rc-chrono__step"
              aria-label={t("hostConsole.resCal.prev")}
              onClick={() => {
                const next = shiftRange(from, to, view, -1);
                setFrom(next.from);
                setTo(next.to);
              }}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="rc-chrono__mid">
              <p className="rc-range">
                <CalendarRange className="rc-range__ico" aria-hidden />
                {formatRangeLabel(from, to, locale)}
              </p>
              <button
                type="button"
                className="rc-chrono__today"
                onClick={goToday}
                aria-label={t("hostConsole.resCal.today")}
              >
                {t("hostConsole.resCal.todayMark")}
              </button>
            </div>
            <button
              type="button"
              className="rc-chrono__step"
              aria-label={t("hostConsole.resCal.next")}
              onClick={() => {
                const next = shiftRange(from, to, view, 1);
                setFrom(next.from);
                setTo(next.to);
              }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <div className="rc-seg rc-hide-sm" role="group" aria-label={t("hostConsole.resCal.view")}>
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

          {showLegend ? (
            <>
              <div className="rc-chrome__rule" aria-hidden />
              <ul className="rc-legend" aria-label={t("hostConsole.resCal.legend")}>
                {PILL_TONES.map((tone) => (
                  <li key={tone}>
                    <i data-status={tone} aria-hidden />
                    {t(`hostConsole.resCal.pill.${tone}`)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="rc-toolbar__row rc-presets rc-toolbar__extras">
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

      {propertyId && properties.length > 1 ? (
        <p className="rc-drag-note">{t("hostConsole.resCal.allPropertiesToDrag")}</p>
      ) : null}

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
                  data-property-id={property.id}
                  data-drop={dragOverId === property.id ? "true" : "false"}
                  style={{ minHeight: `${ROW_PAD * 2 + lanes * LANE_H}px` }}
                >
                  <div className="rc-prop">
                    {property.image ? (
                      <img
                        className="rc-prop__img"
                        src={propertyImageUrl(property.image)}
                        alt=""
                      />
                    ) : null}
                    <div className="min-w-0">
                      <Link
                        href={`/properties/${property.id}/calendar`}
                        className="rc-prop__name"
                      >
                        {property.name}
                      </Link>
                      {(property.city || property.country) && (
                        <p className="rc-prop__meta rc-prop__loc">
                          {[property.city, property.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <Link
                        href={`/properties/${property.id}/calendar`}
                        className="rc-prop__meta rc-prop__avail mt-0.5 inline-flex items-center gap-1"
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
                        style={{ left: todayLeft * dayPx + dayPx / 2 }}
                      />
                    ) : null}
                    {placed.length === 0 ? (
                      <p className="rc-empty">{t("hostConsole.resCal.noReservations")}</p>
                    ) : (
                      placed.map((booking) => {
                        const preview =
                          resizePreview?.id === booking._id ? resizePreview : null;
                        const shown = preview
                          ? {
                              ...booking,
                              checkIn: preview.checkIn,
                              checkOut: preview.checkOut,
                            }
                          : booking;
                        const geo = barGeometry(shown, days, dayPx);
                        if (!geo) return null;
                        const tone = pillStatus(shown, today);
                        const draggable = stayDraggable(booking, {
                          today,
                          propertyFilter: propertyId,
                          propertyCount: properties.length,
                        });
                        const resizable = stayResizable(booking, today);
                        const resizeStart = resizable && booking.checkIn >= today;
                        const resizeEnd = resizable && booking.checkOut > today;
                        const guestLabel =
                          firstName(booking.guestName) || t("hostConsole.guest");
                        return (
                          <div
                            key={booking._id}
                            role="button"
                            tabIndex={0}
                            className="rc-bar"
                            data-status={tone}
                            data-on={selectedId === booking._id ? "true" : "false"}
                            data-hit={hits.has(booking._id) ? "true" : "false"}
                            data-dragging={draggingId === booking._id ? "true" : "false"}
                            data-resizing={preview ? "true" : "false"}
                            data-draggable={draggable ? "true" : "false"}
                            aria-label={
                              draggable
                                ? t("hostConsole.resCal.dragAria", {
                                    guest: guestLabel,
                                  })
                                : guestLabel
                            }
                            ref={(el) => {
                              if (el) barRefs.current.set(booking._id, el);
                              else barRefs.current.delete(booking._id);
                            }}
                            style={{
                              left: geo.left + 4,
                              width: Math.max(48, geo.width - 8),
                              top: ROW_PAD + booking.lane * LANE_H,
                              cursor: draggable ? "grab" : "pointer",
                            }}
                            onPointerDown={(e) => {
                              if (e.target.closest(".rc-bar__edge")) return;
                              if (!draggable || e.button !== 0) return;
                              e.currentTarget.setPointerCapture?.(e.pointerId);
                              dragRef.current = {
                                type: "move",
                                booking,
                                x: e.clientX,
                                y: e.clientY,
                                active: false,
                              };
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            onClick={() => {
                              if (suppressClickRef.current) return;
                              setSelectedId(booking._id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              if (!suppressClickRef.current) {
                                setSelectedId(booking._id);
                              }
                            }}
                          >
                            {resizeStart ? (
                              <span
                                className="rc-bar__edge rc-bar__edge--start"
                                aria-label={t("hostConsole.resCal.resizeAriaStart", {
                                  guest: guestLabel,
                                })}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  if (e.button !== 0) return;
                                  e.preventDefault();
                                  e.currentTarget.setPointerCapture?.(e.pointerId);
                                  dragRef.current = {
                                    type: "resize",
                                    edge: "start",
                                    booking,
                                    x: e.clientX,
                                    origIn: booking.checkIn,
                                    origOut: booking.checkOut,
                                    previewIn: booking.checkIn,
                                    previewOut: booking.checkOut,
                                    active: false,
                                  };
                                  setResizeError("");
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : null}
                            {resizeEnd ? (
                              <span
                                className="rc-bar__edge rc-bar__edge--end"
                                aria-label={t("hostConsole.resCal.resizeAriaEnd", {
                                  guest: guestLabel,
                                })}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  if (e.button !== 0) return;
                                  e.preventDefault();
                                  e.currentTarget.setPointerCapture?.(e.pointerId);
                                  dragRef.current = {
                                    type: "resize",
                                    edge: "end",
                                    booking,
                                    x: e.clientX,
                                    origIn: booking.checkIn,
                                    origOut: booking.checkOut,
                                    previewIn: booking.checkIn,
                                    previewOut: booking.checkOut,
                                    active: false,
                                  };
                                  setResizeError("");
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : null}
                            <span className="rc-bar__face">
                              {draggable ? (
                                <span className="rc-bar__grip" aria-hidden>
                                  <GripVertical className="h-3.5 w-3.5" />
                                </span>
                              ) : null}
                              <GuestAvatar
                                name={booking.guestName}
                                src={booking.guestImage}
                              />
                            </span>
                            <span className="rc-bar__meta">
                              <span className="rc-bar__name">
                                {guestLabel}
                              </span>
                              <span className="rc-bar__sub">
                                <span className="rc-bar__chip" data-status={tone}>
                                  {t(`hostConsole.resCal.pill.${tone}`)}
                                </span>
                              </span>
                            </span>
                          </div>
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

      {filtersOpen ? (
        <>
          <button
            type="button"
            className="rc-scrim rc-filters-scrim"
            aria-label={t("hostConsole.resCal.close")}
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className="rc-filters"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rc-filters-title"
          >
            <div className="rc-filters__top">
              <p id="rc-filters-title">{t("hostConsole.resCal.filters")}</p>
              <button
                type="button"
                className="rc-btn rc-btn--ghost"
                aria-label={t("hostConsole.resCal.close")}
                onClick={() => setFiltersOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="rc-filters__body">
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
              <label>
                {t("hostConsole.resCal.from")}
                <input
                  type="date"
                  value={customFrom || from}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label>
                {t("hostConsole.resCal.to")}
                <input
                  type="date"
                  value={customTo || to}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rc-btn rc-btn--accent rc-filters__done"
                onClick={() => {
                  applyCustom();
                  setFiltersOpen(false);
                }}
              >
                {t("hostConsole.resCal.filtersDone")}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {resizePreview ? (
        <p className="rc-drop-hint">
          {t("hostConsole.resCal.resizeHint", {
            checkIn: resizePreview.checkIn,
            checkOut: resizePreview.checkOut,
            n: countNights(resizePreview.checkIn, resizePreview.checkOut),
          })}
        </p>
      ) : draggingId ? (
        <p className="rc-drop-hint">{t("hostConsole.resCal.dropToMove")}</p>
      ) : resizeError ? (
        <p className="rc-drop-hint rc-drop-hint--err">{resizeError}</p>
      ) : null}

      {selected ? (
        <ReservationDrawer
          booking={selected}
          properties={properties}
          onClose={() => setSelectedId(null)}
          onChanged={() => load({ silent: true })}
        />
      ) : null}

      {pendingMove ? (
        <MoveStayConfirm
          booking={pendingMove.booking}
          fromProperty={pendingMove.from}
          toProperty={pendingMove.to}
          busy={moveBusy}
          error={moveError}
          onConfirm={confirmPendingMove}
          onCancel={() => {
            if (moveBusy) return;
            setPendingMove(null);
            setMoveError("");
          }}
        />
      ) : null}
    </div>
  );
}
