"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  WEEKDAYS,
  addDays,
  buildMonthGrid,
  getDayStatus,
  getMonthLabel,
  isDateInRange,
  isPast,
  isToday,
  normalizeSelection,
} from "@/utils/availability/calendarGrid";
import {
  formatGuestDate,
  validateStayDates,
} from "@/utils/availability/validateStay";

export default function GuestDateRangePicker({
  propertyId,
  checkIn,
  checkOut,
  onChange,
  onValidationError,
  disabled = false,
  embedded = false,
}) {
  const now = new Date();
  const [open, setOpen] = useState(embedded);
  const [activeField, setActiveField] = useState("checkIn");
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideDir, setSlideDir] = useState(0);
  const panelRef = useRef(null);

  const loadAvailability = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`);
      const data = await res.json();
      if (res.ok) {
        setUnavailableRanges(data.unavailableRanges || []);
      }
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (embedded || open) loadAvailability();
  }, [embedded, open, loadAvailability]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open && !embedded) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open, embedded]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const changeMonth = (delta) => {
    setSlideDir(delta);
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const openPicker = (field) => {
    if (disabled) return;
    setActiveField(field);
    setOpen(true);
    if (checkIn) {
      const t = checkIn.split("-").map(Number);
      setViewYear(t[0]);
      setViewMonth(t[1] - 1);
    }
  };

  const isInStaySelection = (dateStr) => {
    if (!checkIn) return false;
    if (!checkOut) return dateStr === checkIn;
    return isDateInRange(dateStr, checkIn, checkOut);
  };

  const handleDayClick = (dateStr) => {
    if (isPast(dateStr)) return;
    const status = getDayStatus(dateStr, { unavailableRanges });
    if (status !== "available") return;

    if (activeField === "checkIn" || !checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: dateStr, checkOut: null });
      setActiveField("checkOut");
      return;
    }

    const norm = normalizeSelection(checkIn, dateStr);
    const nextCheckOut =
      norm.startDate === norm.endDate
        ? addDays(norm.startDate, 1)
        : norm.endDate;

    const validation = validateStayDates(
      norm.startDate,
      nextCheckOut,
      unavailableRanges,
    );
    if (!validation.ok) {
      onValidationError?.(validation.error);
      return;
    }

    onChange({ checkIn: norm.startDate, checkOut: nextCheckOut });
    onValidationError?.("");
    if (!embedded) setOpen(false);
  };

  const clearDates = (e) => {
    e.stopPropagation();
    onChange({ checkIn: null, checkOut: null });
    setActiveField("checkIn");
  };

  const gridAnimation =
    slideDir < 0
      ? "animate-[calendarSlideLeft_0.35s_ease-out]"
      : slideDir > 0
        ? "animate-[calendarSlideRight_0.35s_ease-out]"
        : "animate-[calendarFadeIn_0.35s_ease-out]";

  const fieldActive =
    "border-[var(--kama-accent)] ring-2 ring-[var(--kama-accent-glow)] bg-[var(--kama-surface)]";
  const fieldIdle =
    "border-[var(--kama-border)] bg-[var(--kama-field)] hover:border-[var(--kama-border-strong)]";

  return (
    <div ref={panelRef} className="relative z-[70]">
      <div className="grid grid-cols-2 gap-2.5 text-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={() => openPicker("checkIn")}
          className={`rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
            open && activeField === "checkIn" ? fieldActive : fieldIdle
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="mb-0.5 block text-[11px] font-medium text-[var(--kama-ink-muted)]">
            Check-in
          </span>
          <span className="font-medium text-[var(--kama-ink)]">
            {checkIn ? formatGuestDate(checkIn) : "Add date"}
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => openPicker("checkOut")}
          className={`rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
            open && activeField === "checkOut" ? fieldActive : fieldIdle
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="mb-0.5 block text-[11px] font-medium text-[var(--kama-ink-muted)]">
            Check-out
          </span>
          <span className="font-medium text-[var(--kama-ink)]">
            {checkOut ? formatGuestDate(checkOut) : "Add date"}
          </span>
        </button>
      </div>

      {(checkIn || checkOut) && (
        <button
          type="button"
          onClick={clearDates}
          className="mt-1.5 text-xs font-medium text-[var(--kama-ink-muted)] underline-offset-2 hover:text-[var(--kama-ink)] hover:underline"
        >
          Clear dates
        </button>
      )}

      {open && (
        <div
          className={
            embedded
              ? "mt-3 overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)]"
              : "absolute left-0 right-0 z-[80] mt-2 overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-[0_20px_48px_rgba(12,26,26,0.14)] animate-[calendarFadeIn_0.25s_ease-out] sm:left-auto sm:right-0 sm:w-[min(100%,20rem)]"
          }
          role={embedded ? "group" : "dialog"}
          aria-label="Choose dates"
        >
          <div className="flex items-center justify-between border-b border-[var(--kama-border)] px-3 py-2.5">
            <p className="text-xs font-medium text-[var(--kama-ink-muted)]">
              {activeField === "checkOut" && checkIn && !checkOut
                ? "Select check-out"
                : "Select check-in"}
            </p>
            {embedded ? (
              <span className="text-[10px] font-medium text-[var(--kama-ink-muted)]">
                Unavailable nights are blocked
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-2 py-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--kama-ink)] hover:bg-[var(--kama-field)] active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span
              key={`${viewYear}-${viewMonth}`}
              className="text-sm font-semibold text-[var(--kama-ink)] animate-[calendarFadeIn_0.3s_ease-out]"
            >
              {getMonthLabel(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--kama-ink)] hover:bg-[var(--kama-field)] active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--kama-border)] px-px">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-[var(--kama-field)] py-1 text-center text-[9px] font-bold uppercase text-[var(--kama-ink-muted)]"
              >
                {d.slice(0, 2)}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--kama-ink-muted)]">
              Loading…
            </div>
          ) : (
            <div
              key={`g-${viewYear}-${viewMonth}-${slideDir}`}
              className={`grid grid-cols-7 gap-px bg-[var(--kama-border)] p-px ${gridAnimation}`}
            >
              {monthCells.map(({ date, inMonth }) => {
                const status = getDayStatus(date, { unavailableRanges });
                const past = isPast(date);
                const unavailable = status !== "available";
                const disabledDay = past || unavailable;
                const selected = isInStaySelection(date);
                const today = isToday(date);

                let cls =
                  "relative flex aspect-square items-center justify-center text-xs font-medium transition-all duration-150 ";

                if (!inMonth) cls += "text-[var(--kama-ink-muted)]/40 bg-[var(--kama-field)]/90 ";
                else if (disabledDay)
                  cls +=
                    status === "booked"
                      ? "bg-[var(--kama-canvas-soft)] text-[var(--kama-ink-muted)] cursor-not-allowed "
                      : "bg-amber-50 text-amber-300 cursor-not-allowed line-through ";
                else
                  cls +=
                    "bg-[var(--kama-surface)] text-[var(--kama-ink)] hover:bg-[var(--kama-accent-soft)] cursor-pointer active:scale-95 ";

                if (selected && inMonth && !disabledDay)
                  cls +=
                    "!bg-[var(--kama-accent)] !text-white hover:!bg-[var(--kama-accent-hover)] ";
                if (today && inMonth && !selected)
                  cls +=
                    "font-bold ring-1 ring-[var(--kama-accent)]/40 ring-inset ";

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => handleDayClick(date)}
                    className={cls}
                  >
                    {parseInt(date.slice(8), 10)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
