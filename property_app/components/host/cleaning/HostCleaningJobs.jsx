"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { TYPE_LABELS, formatYmd } from "@/utils/cleaners/status";

export default function HostCleaningJobs({ scope }) {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const qs = scope ? `?scope=${scope}` : "";
    fetch(`/api/host/cleaning/jobs${qs}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setJobs(json.jobs || []);
      })
      .catch(() => setError("Could not load cleanings"));
  }, [scope]);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!jobs) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6 text-sm text-[var(--kama-ink-muted)]">
        Nothing here yet.{" "}
        <Link href="/host/cleaning/jobs/new" className="text-[var(--kama-accent)]">
          Ask a cleaner
        </Link>
        .
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {jobs.map((job) => (
        <li key={job._id}>
          <Link
            href={`/host/cleaning/jobs/${job._id}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {job.propertyName || job.propertyId?.name}
              </p>
              <p className="text-xs text-[var(--kama-ink-muted)]">
                {formatYmd(job.scheduledDate)} · {job.scheduledStartTime}–{job.scheduledEndTime} ·{" "}
                {TYPE_LABELS[job.cleaningType]}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
