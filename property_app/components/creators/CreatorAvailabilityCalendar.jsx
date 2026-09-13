"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  WEEKDAYS,
  buildMonthGrid,
  getDayStatus,
  getMonthLabel,
  isPast,
  isToday,
} from "@/utils/availability/calendarGrid";

/**
 * Read-only availability month for creators planning social posts.
 */
export default function CreatorAvailabilityCalendar({
  unavailableRanges = [],
  propertyName,
  compact = false,
  promotionPaused = false,
  pausedCodes = [],
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());

  const cells = useMemo(
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

  let availableInMonth = 0;
  let bookedInMonth = 0;
  for (const cell of cells) {
    if (!cell.inMonth || isPast(cell.date)) continue;
    const status = getDayStatus(cell.date, { unavailableRanges });
    if (status === "available") availableInMonth += 1;
    else bookedInMonth += 1;
  }

  return (
    <div
      className={`rounded-2xl border bg-[var(--kama-surface)] ${
        promotionPaused
          ? "border-amber-300/80"
          : "border-[var(--kama-border)]"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {promotionPaused ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <p className="font-semibold">Promo paused by host</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            {pausedCodes.length
              ? `${pausedCodes.join(", ")} won’t attribute bookings right now.`
              : "Your code won’t attribute bookings right now."}{" "}
            The listing may still show open nights below — do not promote them
            until the host resumes your code.
          </p>
        </div>
      ) : null}

      <div className={`mb-3 flex items-center justify-between gap-2 ${promotionPaused ? "opacity-55" : ""}`}>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--kama-ink)]">
            {propertyName || "Availability"}
          </p>
          <p className="text-[11px] text-[var(--kama-ink-muted)]">
            {promotionPaused
              ? "Calendar is informational only while paused"
              : `${availableInMonth} open nights · ${bookedInMonth} unavailable this month`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-full p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[7.5rem] text-center text-xs font-semibold text-[var(--kama-ink)]">
            {getMonthLabel(viewYear, viewMonth)}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full p-1.5 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)] ${promotionPaused ? "opacity-55" : ""}`}>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d.slice(0, 2)}</span>
        ))}
      </div>

      <div className={`mt-1 grid grid-cols-7 gap-1 ${promotionPaused ? "opacity-45 grayscale" : ""}`}>
        {cells.map((cell) => {
          const past = isPast(cell.date);
          const status = getDayStatus(cell.date, { unavailableRanges });
          const today = isToday(cell.date);
          let tone =
            "bg-[var(--kama-field)] text-[var(--kama-ink)] ring-1 ring-[var(--kama-border)]";
          if (!cell.inMonth) {
            tone = "bg-transparent text-[var(--kama-ink-muted)]/40";
          } else if (past) {
            tone = "bg-transparent text-[var(--kama-ink-muted)]/50";
          } else if (status === "booked") {
            tone = "bg-slate-200 text-slate-600";
          } else if (status === "blocked") {
            tone = "bg-amber-100 text-amber-900";
          } else if (promotionPaused) {
            tone = "bg-slate-100 text-slate-500 ring-1 ring-slate-200";
          } else {
            tone =
              "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80";
          }

          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${
                !cell.inMonth
                  ? "—"
                  : past
                    ? "past"
                    : promotionPaused && status === "available"
                      ? "open on Isisel — do not promote (code paused)"
                      : status
              }`}
              className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium tabular-nums ${tone} ${
                today ? "outline outline-2 outline-[var(--kama-accent)]" : ""
              }`}
            >
              {Number(cell.date.slice(-2))}
            </div>
          );
        })}
      </div>

      <div className={`mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--kama-ink-muted)] ${promotionPaused ? "opacity-55" : ""}`}>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-sm ring-1 ${
              promotionPaused
                ? "bg-slate-200 ring-slate-300"
                : "bg-emerald-200 ring-emerald-300"
            }`}
          />
          {promotionPaused ? "Open (not for promo)" : "Open to book"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-300" />
          Booked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-amber-200" />
          Host blocked
        </span>
      </div>
    </div>
  );
}
