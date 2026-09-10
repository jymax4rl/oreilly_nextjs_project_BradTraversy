"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  WEEKDAYS,
  addDays,
  buildMonthGrid,
  isPast,
  isToday,
  isDateInRange,
  getMonthLabel,
  normalizeSelection,
} from "@/utils/availability/calendarGrid";
import { formatGuestDate } from "@/utils/availability/validateStay";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Compact check-in / check-out control for the home discovery search card.
 * No property availability — any future dates are selectable.
 */
export default function DiscoveryDateRangeField({
  checkIn = "",
  checkOut = "",
  onChange,
}) {
  const { t } = useLanguage();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState("checkIn");
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const changeMonth = (delta) => {
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

  const openPicker = () => {
    setActiveField(checkIn && !checkOut ? "checkOut" : "checkIn");
    setOpen(true);
    if (checkIn) {
      const parts = checkIn.split("-").map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  };

  const handleDayClick = (dateStr) => {
    if (isPast(dateStr)) return;

    if (activeField === "checkIn" || !checkIn || (checkIn && checkOut)) {
      onChange?.({ checkIn: dateStr, checkOut: "" });
      setActiveField("checkOut");
      return;
    }

    const norm = normalizeSelection(checkIn, dateStr);
    const nextCheckOut =
      norm.startDate === norm.endDate
        ? addDays(norm.startDate, 1)
        : norm.endDate;
    onChange?.({ checkIn: norm.startDate, checkOut: nextCheckOut });
    setOpen(false);
  };

  const summary =
    checkIn && checkOut
      ? `${formatGuestDate(checkIn)} – ${formatGuestDate(checkOut)}`
      : checkIn
        ? `${formatGuestDate(checkIn)} – …`
        : t("search.selectDates");

  return (
    <div className="discovery-search-card__field" ref={rootRef}>
      <button
        type="button"
        className="discovery-search-card__cell"
        onClick={openPicker}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="discovery-search-card__cell-icon" aria-hidden />
        <span className="discovery-search-card__cell-copy">
          <span className="discovery-search-card__cell-label">
            <span className="discovery-search-card__label-full">
              {t("search.checkInOut")}
            </span>
            <span className="discovery-search-card__label-short">
              {t("search.dates")}
            </span>
          </span>
          <span
            className={`discovery-search-card__cell-value${
              checkIn ? "" : " is-placeholder"
            }`}
          >
            {summary}
          </span>
        </span>
      </button>

      {open ? (
        <div
          className="discovery-search-card__dates-panel"
          role="dialog"
          aria-label={t("search.checkInOut")}
        >
          <div className="discovery-search-card__dates-toolbar">
            <button
              type="button"
              className="discovery-search-card__dates-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="discovery-search-card__dates-month">
              {getMonthLabel(viewYear, viewMonth)}
            </p>
            <button
              type="button"
              className="discovery-search-card__dates-nav"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {(checkIn || checkOut) && (
              <button
                type="button"
                className="discovery-search-card__dates-clear"
                onClick={() => {
                  onChange?.({ checkIn: "", checkOut: "" });
                  setActiveField("checkIn");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="discovery-search-card__dates-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="discovery-search-card__dates-grid">
            {monthCells.map((cell) => {
              const dateStr = cell.date;
              const selected =
                checkIn &&
                (dateStr === checkIn ||
                  dateStr === checkOut ||
                  (checkOut && isDateInRange(dateStr, checkIn, checkOut)));
              const past = isPast(dateStr);
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={past || !cell.inMonth}
                  onClick={() => handleDayClick(dateStr)}
                  className={`discovery-search-card__day${
                    selected ? " is-selected" : ""
                  }${isToday(dateStr) ? " is-today" : ""}${
                    past || !cell.inMonth ? " is-past" : ""
                  }`}
                >
                  {Number(dateStr.slice(-2))}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
