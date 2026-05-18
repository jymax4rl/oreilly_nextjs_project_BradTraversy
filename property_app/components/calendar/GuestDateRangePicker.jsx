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
}) {
  const now = new Date();
  const [open, setOpen] = useState(false);
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
    if (open) loadAvailability();
  }, [open, loadAvailability]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open]);

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
    setOpen(false);
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

  return (
    <div ref={panelRef} className="relative">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={() => openPicker("checkIn")}
          className={`rounded-xl border p-3 text-left transition-all duration-200 ${
            open && activeField === "checkIn"
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 hover:border-slate-300"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
            Check-in
          </span>
          <span className="font-medium text-slate-900">
            {checkIn ? formatGuestDate(checkIn) : "Add date"}
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => openPicker("checkOut")}
          className={`rounded-xl border p-3 text-left transition-all duration-200 ${
            open && activeField === "checkOut"
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 hover:border-slate-300"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
            Check-out
          </span>
          <span className="font-medium text-slate-900">
            {checkOut ? formatGuestDate(checkOut) : "Add date"}
          </span>
        </button>
      </div>

      {(checkIn || checkOut) && (
        <button
          type="button"
          onClick={clearDates}
          className="mt-1.5 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          Clear dates
        </button>
      )}

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-[calendarFadeIn_0.25s_ease-out] sm:left-auto sm:right-0 sm:w-[min(100%,20rem)]"
          role="dialog"
          aria-label="Choose dates"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-600">
              {activeField === "checkOut" && checkIn && !checkOut
                ? "Select check-out"
                : "Select check-in"}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 py-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span
              key={`${viewYear}-${viewMonth}`}
              className="text-sm font-semibold animate-[calendarFadeIn_0.3s_ease-out]"
            >
              {getMonthLabel(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 px-px">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-slate-50 py-1 text-center text-[9px] font-bold uppercase text-slate-400"
              >
                {d.slice(0, 2)}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Loading…
            </div>
          ) : (
            <div
              key={`g-${viewYear}-${viewMonth}-${slideDir}`}
              className={`grid grid-cols-7 gap-px bg-slate-100 p-px ${gridAnimation}`}
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

                if (!inMonth) cls += "text-slate-300 bg-slate-50/90 ";
                else if (disabledDay)
                  cls +=
                    status === "booked"
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed "
                      : "bg-amber-50 text-amber-300 cursor-not-allowed line-through ";
                else
                  cls +=
                    "bg-white text-slate-800 hover:bg-indigo-50 cursor-pointer active:scale-95 ";

                if (selected && inMonth && !disabledDay)
                  cls += "bg-indigo-600 text-white hover:bg-indigo-700 ";
                if (today && inMonth && !selected)
                  cls += "font-bold ring-1 ring-indigo-300 ring-inset ";

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
