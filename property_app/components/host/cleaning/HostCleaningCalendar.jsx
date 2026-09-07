"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { addDaysYmd, localTodayYmd } from "@/utils/host/reservationsCalendar";
import { formatYmd } from "@/utils/cleaners/status";

export default function HostCleaningCalendar() {
  const today = localTodayYmd();
  const [view, setView] = useState("week");
  const [jobs, setJobs] = useState([]);

  const from = today;
  const to = view === "day" ? today : view === "week" ? addDaysYmd(today, 6) : addDaysYmd(today, 30);

  useEffect(() => {
    fetch(`/api/host/cleaning/calendar?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((json) => setJobs(json.jobs || []));
  }, [from, to]);

  const days = useMemo(() => {
    const list = [];
    let cursor = from;
    while (cursor <= to) {
      list.push(cursor);
      cursor = addDaysYmd(cursor, 1);
    }
    return list;
  }, [from, to]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {["day", "week", "month"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              view === key
                ? "bg-[var(--kama-ink)] text-white"
                : "text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)]"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {days.map((day) => {
          const dayJobs = jobs.filter((job) => job.scheduledDate === day);
          return (
            <section key={day} className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
              <h3 className="text-sm font-semibold">{formatYmd(day)}</h3>
              {dayJobs.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--kama-ink-muted)]">No cleanings</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dayJobs.map((job) => (
                    <li key={job._id}>
                      <Link href={`/host/cleaning/jobs/${job._id}`} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {job.scheduledStartTime} {job.propertyName}
                        </span>
                        <StatusBadge status={job.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
