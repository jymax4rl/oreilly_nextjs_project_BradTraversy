"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Save,
  Unlock,
  X,
} from "lucide-react";
import {
  WEEKDAYS,
  addDays,
  buildMonthGrid,
  getDayStatus,
  getMonthLabel,
  isPast,
  isToday,
  normalizeSelection,
} from "@/utils/availability/calendarGrid";
import { rangesOverlap } from "@/utils/availability/dateUtils";
import {
  formatBlockLabel,
  removeHostBlockAt,
  unlockDayFromHostBlocks,
} from "@/utils/availability/hostBlocks";
import {
  customDayRatesToMap,
  getCustomRateForDate,
  removeCustomDayRate,
  upsertCustomDayRate,
} from "@/utils/availability/customDayRates";
import { getDefaultNightlyUsd } from "@/utils/propertyRates";

export default function HostAvailabilityCalendar({ propertyId, baseRates = {} }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());
  const [hostBlocks, setHostBlocks] = useState([]);
  const [customDayRates, setCustomDayRates] = useState([]);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [selectedRateDate, setSelectedRateDate] = useState(null);
  const [rateDraft, setRateDraft] = useState("");
  const [defaultAvailability, setDefaultAvailability] = useState("open");
  const [mode, setMode] = useState("block");
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [slideDir, setSlideDir] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`);
      const avail = await res.json();
      if (!res.ok) throw new Error(avail.error || "Failed to load calendar");
      setHostBlocks(avail.hostBlocks || []);
      setCustomDayRates(avail.customDayRates || []);
      setUnavailableRanges(avail.unavailableRanges || []);
      setDefaultAvailability(avail.defaultAvailability || "open");
      setSelectedRateDate(null);
      setRateDraft("");
    } catch (e) {
      setError(e.message || "Could not load calendar");
    } finally {
      setLoading(false);
      setDirty(false);
      setEditingIndex(null);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selection = useMemo(
    () => normalizeSelection(selectStart, selectEnd),
    [selectStart, selectEnd],
  );

  const customRateMap = useMemo(
    () => customDayRatesToMap(customDayRates),
    [customDayRates],
  );

  const defaultNightlyUsd = useMemo(
    () => getDefaultNightlyUsd(baseRates),
    [baseRates],
  );

  const changeMonth = (delta) => {
    setSlideDir(delta);
    setSelectStart(null);
    setSelectEnd(null);
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

  const markDirty = () => {
    setDirty(true);
    setSuccess("");
  };

  const handleDayClick = (dateStr, status) => {
    if (!dateStr || isPast(dateStr)) return;
    if (status === "booked") return;

    if (mode === "rate") {
      setSelectedRateDate(dateStr);
      const existing = getCustomRateForDate(customDayRates, dateStr);
      setRateDraft(existing != null ? String(existing) : "");
      return;
    }

    if (mode === "unlock") {
      if (status !== "blocked") return;
      setHostBlocks((prev) => unlockDayFromHostBlocks(prev, dateStr));
      markDirty();
      setSuccess("Date unlocked — tap Save calendar to apply");
      return;
    }

    if (status === "blocked") {
      setMode("unlock");
      setHostBlocks((prev) => unlockDayFromHostBlocks(prev, dateStr));
      markDirty();
      setSuccess("Switched to Unlock — tap Save when finished");
      return;
    }

    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(dateStr);
      setSelectEnd(null);
      return;
    }

    setSelectEnd(dateStr);
  };

  const addBlockFromSelection = () => {
    if (!selection.startDate) return;

    const norm = normalizeSelection(
      selection.startDate,
      selection.endDate || selection.startDate,
    );
    const block = {
      startDate: norm.startDate,
      endDate: addDays(norm.endDate, 1),
    };

    for (const b of hostBlocks) {
      if (rangesOverlap(block, b)) {
        setError("Selection overlaps an existing block");
        return;
      }
    }
    for (const r of unavailableRanges) {
      if (r.source === "booking" && rangesOverlap(block, r)) {
        setError("Selection overlaps a confirmed booking");
        return;
      }
    }

    setHostBlocks((prev) => [...prev, block]);
    setSelectStart(null);
    setSelectEnd(null);
    markDirty();
    setError("");
    setSuccess("Dates blocked — tap Save calendar to apply");
  };

  const unlockEntireBlock = (index) => {
    setHostBlocks((prev) => removeHostBlockAt(prev, index));
    if (editingIndex === index) setEditingIndex(null);
    markDirty();
    setSuccess("Period unlocked — tap Save calendar to apply");
  };

  const startEditBlock = (index) => {
    setEditingIndex(index);
    setMode("block");
    setSelectStart(null);
    setSelectEnd(null);
    const block = hostBlocks[index];
    if (block?.startDate) {
      const [y, m] = block.startDate.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  };

  const updateBlockDates = (index, startDate, endDate) => {
    if (!startDate || !endDate) return;
    const exclusiveEnd =
      startDate === endDate ? addDays(startDate, 1) : addDays(endDate, 1);
    const updated = {
      startDate,
      endDate: exclusiveEnd,
      note: hostBlocks[index]?.note,
    };

    for (let i = 0; i < hostBlocks.length; i++) {
      if (i === index) continue;
      if (rangesOverlap(updated, hostBlocks[i])) {
        setError("Updated range overlaps another block");
        return;
      }
    }

    setHostBlocks((prev) =>
      prev.map((b, i) => (i === index ? updated : b)),
    );
    setEditingIndex(null);
    markDirty();
    setError("");
    setSuccess("Block updated — tap Save calendar to apply");
  };

  const applyCustomRate = () => {
    if (!selectedRateDate) return;
    setCustomDayRates((prev) =>
      upsertCustomDayRate(prev, selectedRateDate, rateDraft),
    );
    markDirty();
    setSuccess(`Custom rate set for ${selectedRateDate} — tap Save calendar`);
    setError("");
  };

  const clearCustomRate = () => {
    if (!selectedRateDate) return;
    setCustomDayRates((prev) => removeCustomDayRate(prev, selectedRateDate));
    setRateDraft("");
    markDirty();
    setSuccess(`Using default rate for ${selectedRateDate} — tap Save calendar`);
    setError("");
  };

  const removeCustomRateEntry = (date) => {
    setCustomDayRates((prev) => removeCustomDayRate(prev, date));
    if (selectedRateDate === date) {
      setSelectedRateDate(null);
      setRateDraft("");
    }
    markDirty();
    setSuccess("Custom rate removed — tap Save calendar");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostBlocks,
          defaultAvailability,
          customDayRates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details?.join?.(" ") || data.error || "Save failed";
        throw new Error(msg);
      }
      setHostBlocks(data.hostBlocks || []);
      setDefaultAvailability(data.defaultAvailability || "open");
      setCustomDayRates(data.customDayRates || []);
      setUnavailableRanges(data.unavailableRanges || []);
      setDirty(false);
      setEditingIndex(null);
      setSuccess("Calendar saved");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isInSelection = (dateStr) => {
    if (mode !== "block" || !selection.startDate) return false;
    if (!selection.endDate) return dateStr === selection.startDate;
    const norm = normalizeSelection(selection.startDate, selection.endDate);
    return (
      dateStr >= norm.startDate &&
      dateStr <= norm.endDate
    );
  };

  const gridAnimation =
    slideDir < 0
      ? "animate-[calendarSlideLeft_0.35s_ease-out]"
      : slideDir > 0
        ? "animate-[calendarSlideRight_0.35s_ease-out]"
        : "animate-[calendarFadeIn_0.35s_ease-out]";

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("block");
            setSelectStart(null);
            setSelectEnd(null);
            setSelectedRateDate(null);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:text-sm ${
            mode === "block"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lock size={16} aria-hidden />
          Block
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("rate");
            setSelectStart(null);
            setSelectEnd(null);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:text-sm ${
            mode === "rate"
              ? "bg-white text-violet-900 shadow-sm ring-1 ring-violet-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <DollarSign size={16} aria-hidden />
          Custom $
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("unlock");
            setSelectStart(null);
            setSelectEnd(null);
            setSelectedRateDate(null);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:text-sm ${
            mode === "unlock"
              ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Unlock size={16} aria-hidden />
          Unlock
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        {mode === "block" &&
          "Select a range, then Block selected dates. Save to update the listing."}
        {mode === "rate" &&
          "Tap a day to set a custom price (USD). Save calendar when finished."}
        {mode === "unlock" &&
          "Tap blocked days to open them again, or unlock a full period below."}
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft size={22} />
          </button>
          <h2
            key={`${viewYear}-${viewMonth}`}
            className="text-lg font-semibold text-slate-900 animate-[calendarFadeIn_0.35s_ease-out]"
          >
            {getMonthLabel(viewYear, viewMonth)}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px border-b border-slate-100 bg-slate-100 px-px pt-px">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="bg-slate-50 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div
          key={`grid-${viewYear}-${viewMonth}-${slideDir}`}
          className={`grid grid-cols-7 gap-px bg-slate-100 p-px ${gridAnimation}`}
        >
          {monthCells.map(({ date, inMonth }) => {
            const status = getDayStatus(date, { hostBlocks, unavailableRanges });
            const past = isPast(date);
            const today = isToday(date);
            const selected = isInSelection(date);
            const rateSelected = mode === "rate" && selectedRateDate === date;
            const customPrice = customRateMap.get(date);
            const disabled = past || status === "booked";

            let cellClass =
              "relative flex aspect-square flex-col items-center justify-center text-sm font-medium transition-all duration-200 ease-out ";

            if (!inMonth) cellClass += "bg-slate-50/80 text-slate-300 ";
            else if (status === "booked")
              cellClass += "bg-slate-200 text-slate-500 cursor-not-allowed ";
            else if (status === "blocked") {
              cellClass +=
                mode === "unlock"
                  ? "bg-amber-200 text-amber-950 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer ring-1 ring-amber-300/50 active:scale-95 "
                  : mode === "rate"
                    ? "bg-amber-50 text-amber-900 hover:bg-violet-50 cursor-pointer active:scale-95 "
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer active:scale-95 ";
            } else if (past)
              cellClass += "bg-white text-slate-300 cursor-not-allowed ";
            else
              cellClass +=
                mode === "unlock"
                  ? "bg-white text-slate-400 cursor-default "
                  : mode === "rate"
                    ? "bg-white text-slate-800 hover:bg-violet-50 cursor-pointer active:scale-95 "
                    : "bg-white text-slate-800 hover:bg-indigo-50 cursor-pointer active:scale-95 ";

            if (selected && inMonth && mode === "block")
              cellClass +=
                "ring-2 ring-indigo-500 ring-inset bg-indigo-100 text-indigo-900 z-[1] ";
            if (rateSelected && inMonth)
              cellClass +=
                "ring-2 ring-violet-500 ring-inset bg-violet-50 text-violet-900 z-[1] ";
            if (customPrice != null && inMonth && !rateSelected && mode !== "block")
              cellClass += "bg-violet-50/80 text-violet-900 ";
            if (today && inMonth) cellClass += "font-bold ";

            return (
              <button
                key={date}
                type="button"
                disabled={
                  disabled || (mode === "unlock" && status !== "blocked")
                }
                onClick={() => handleDayClick(date, status)}
                className={cellClass}
                title={
                  customPrice != null
                    ? `Custom $${customPrice}`
                    : status === "blocked" && mode === "unlock"
                      ? "Tap to unlock this day"
                      : mode === "rate"
                        ? "Set custom rate"
                        : undefined
                }
              >
                <span>{parseInt(date.slice(8), 10)}</span>
                {customPrice != null && inMonth && (
                  <span className="mt-0.5 text-[9px] font-bold leading-none text-violet-700">
                    ${customPrice}
                  </span>
                )}
                {status === "blocked" && mode === "unlock" && inMonth && (
                  <LockOpen
                    size={10}
                    className="absolute right-1 top-1 text-emerald-600 opacity-80"
                    aria-hidden
                  />
                )}
                {today && inMonth && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:px-6">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-100" />
            Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-200" />
            Booked
          </span>
          {mode === "block" && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-indigo-100 ring-2 ring-indigo-500 ring-inset" />
              Selecting
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-violet-100 ring-1 ring-violet-300" />
            Custom $
          </span>
        </div>
      </div>

      {mode === "rate" && selectedRateDate && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 animate-[calendarFadeIn_0.25s_ease-out]">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
                Custom rate
              </p>
              <p className="text-sm font-semibold text-slate-900">{selectedRateDate}</p>
              {defaultNightlyUsd != null && (
                <p className="mt-1 text-xs text-violet-700/90">
                  Default: ${defaultNightlyUsd}/night
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRateDate(null);
                setRateDraft("");
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-white/80"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <label className="text-[10px] font-bold uppercase text-slate-500">
            Price (USD)
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rateDraft}
                onChange={(e) => setRateDraft(e.target.value)}
                placeholder={defaultNightlyUsd != null ? String(defaultNightlyUsd) : "0"}
                className="w-full rounded-xl border border-violet-200 bg-white py-2.5 pl-7 pr-3 text-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-400/40"
              />
            </div>
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={applyCustomRate}
              disabled={!rateDraft}
              className="flex-1 rounded-xl bg-violet-700 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-40"
            >
              Apply rate
            </button>
            <button
              type="button"
              onClick={clearCustomRate}
              disabled={getCustomRateForDate(customDayRates, selectedRateDate) == null}
              className="flex-1 rounded-xl border border-violet-300 bg-white py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-40"
            >
              Use default
            </button>
          </div>
        </div>
      )}

      {mode === "rate" && (
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving…" : "Save calendar"}
        </button>
      )}

      {mode === "block" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={addBlockFromSelection}
            disabled={!selectStart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
          >
            <CalendarDays size={18} />
            Block selected dates
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving…" : "Save calendar"}
          </button>
        </div>
      )}

      {mode === "unlock" && (
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>
      )}

      {mode === "block" && selectStart && (
        <p className="text-center text-sm text-slate-500 animate-[calendarFadeIn_0.25s_ease-out]">
          {selectEnd
            ? `Selected ${selection.startDate} → ${selection.endDate}`
            : `Start ${selectStart} — tap end date`}
        </p>
      )}

      {customDayRates.length > 0 && (
        <section className="rounded-2xl border border-violet-100 bg-white p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-700">
            Custom day rates ({customDayRates.length})
          </h3>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {customDayRates.map((row) => (
              <li
                key={row.date}
                className="flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-800">
                  {row.date}
                  <span className="ml-2 tabular-nums text-violet-800">
                    ${row.priceUsd}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomRateEntry(row.date)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Blocked periods ({hostBlocks.length})
        </h3>
        {hostBlocks.length === 0 ? (
          <p className="text-sm text-slate-500">No manual blocks.</p>
        ) : (
          <ul className="space-y-2">
            {hostBlocks.map((block, i) => (
              <li
                key={`${block.startDate}-${block.endDate}-${i}`}
                className={`rounded-xl border px-3 py-3 transition ${
                  editingIndex === i
                    ? "border-indigo-300 bg-indigo-50/50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                {editingIndex === i ? (
                  <BlockEditForm
                    block={block}
                    onSave={(start, end) => updateBlockDates(i, start, end)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-slate-800">
                      {formatBlockLabel(block)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditBlock(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={14} aria-hidden />
                        Modify
                      </button>
                      <button
                        type="button"
                        onClick={() => unlockEntireBlock(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        <LockOpen size={14} aria-hidden />
                        Unlock all
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BlockEditForm({ block, onSave, onCancel }) {
  const lastNight = addDays(block.endDate, -1);
  const [start, setStart] = useState(block.startDate);
  const [end, setEnd] = useState(lastNight);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-indigo-800">Modify blocked period</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold uppercase text-slate-500">
          From
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-slate-500">
          To (last night)
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(start, end)}
          className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
