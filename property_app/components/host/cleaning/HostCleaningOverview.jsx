"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { TYPE_LABELS, formatYmd } from "@/utils/cleaners/status";

function JobCard({ job }) {
  const cleaner = job.cleanerId?.name || job.requestedCleanerId?.name;
  return (
    <Link
      href={`/host/cleaning/jobs/${job._id}`}
      className="block rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 transition hover:border-[var(--kama-border-strong)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--kama-ink)]">
            {job.propertyName || job.propertyId?.name || "Property"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
            {job.checkoutTime ? `Checkout ${job.checkoutTime}` : formatYmd(job.scheduledDate)}
            {job.scheduledStartTime
              ? ` · Cleaning ${job.scheduledStartTime}${job.scheduledEndTime ? `–${job.scheduledEndTime}` : ""}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
            {TYPE_LABELS[job.cleaningType] || job.cleaningType} ·{" "}
            {cleaner || "Unassigned"}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>
    </Link>
  );
}

function Section({ title, jobs, empty }) {
  return (
    <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--kama-ink)]">{title}</h2>
        <span className="text-xs tabular-nums text-[var(--kama-ink-muted)]">
          {jobs.length}
        </span>
      </div>
      {jobs.length === 0 ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job._id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function HostCleaningOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/host/cleaning/overview")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Could not load cleaning overview"));
  }, []);

  if (error) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;
  }

  const g = data.groups;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--kama-ink-muted)]">
          Today’s turnover, upcoming visits, and anything that still needs a cleaner.
        </p>
        <Link
          href="/host/cleaning/jobs/new"
          className="inline-flex rounded-full bg-[var(--kama-accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--kama-accent-hover)]"
        >
          Request cleaning
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Today" jobs={g.today} empty="No cleanings today." />
        <Section title="Upcoming" jobs={g.upcoming} empty="Nothing scheduled ahead." />
        <Section title="Unassigned" jobs={g.unassigned} empty="Every job has a cleaner." />
        <Section title="Pending requests" jobs={g.requested} empty="No open requests." />
        <Section title="In progress" jobs={g.inProgress} empty="No cleanings underway." />
        <Section title="Issues reported" jobs={g.issues} empty="No issues reported." />
        <Section title="Completed" jobs={g.completed} empty="No completed reports yet." />
      </div>
    </div>
  );
}
