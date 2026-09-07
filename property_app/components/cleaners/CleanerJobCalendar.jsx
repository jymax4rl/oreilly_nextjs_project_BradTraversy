"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { formatYmd } from "@/utils/cleaners/status";

export default function CleanerJobCalendar() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch("/api/cleaners/jobs")
      .then((res) => res.json())
      .then((json) => setJobs(json.jobs || []));
  }, []);

  const byDate = jobs.reduce((acc, job) => {
    const key = job.scheduledDate || "unscheduled";
    acc[key] = acc[key] || [];
    acc[key].push(job);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.keys(byDate).length === 0 ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">No scheduled cleanings.</p>
      ) : (
        Object.entries(byDate).map(([date, list]) => (
          <section key={date} className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
            <h2 className="text-sm font-semibold">{formatYmd(date)}</h2>
            <ul className="mt-2 space-y-2">
              {list.map((job) => (
                <li key={job._id}>
                  <Link href={`/cleaners/jobs/${job._id}`} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {job.scheduledStartTime} {job.propertyName}
                    </span>
                    <StatusBadge status={job.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
