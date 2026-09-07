"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { formatYmd } from "@/utils/cleaners/status";

export default function CleanerJobList({ scope }) {
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    const qs = scope ? `?scope=${scope}` : "";
    fetch(`/api/cleaners/jobs${qs}`)
      .then((res) => res.json())
      .then((json) => {
        if (scope === "requests") setJobs(json.groups?.requests || json.jobs || []);
        else if (scope === "history") setJobs(json.groups?.completed || json.jobs || []);
        else setJobs(json.jobs || []);
      });
  }, [scope]);

  if (!jobs) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;
  if (jobs.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 text-sm text-[var(--kama-ink-muted)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {jobs.map((job) => (
        <li key={job._id}>
          <Link
            href={`/cleaners/jobs/${job._id}`}
            className="block rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{job.propertyName}</p>
                <p className="text-sm text-[var(--kama-ink-muted)]">
                  {formatYmd(job.scheduledDate)} · {job.scheduledStartTime}–{job.scheduledEndTime}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
