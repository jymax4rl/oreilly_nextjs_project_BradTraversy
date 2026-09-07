"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/cleaning/StatusBadge";

export default function CleanerDashboard({ name }) {
  const [data, setData] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    fetch("/api/cleaners/jobs")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ groups: { today: [], upcoming: [], requests: [] } }));
    fetch("/api/cleaners/relationships")
      .then((res) => res.json())
      .then((json) => setLinks(json.links || []));
  }, []);

  const pendingHosts = links.filter((link) => link.status === "pending");
  const acceptHost = async (linkId) => {
    await fetch("/api/cleaners/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    });
    setLinks((prev) =>
      prev.map((link) => (link._id === linkId ? { ...link, status: "active" } : link)),
    );
  };

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const groups = data?.groups || {};

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
          {hello}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {name || "Cleaner"}
        </h1>
      </header>

      {pendingHosts.length > 0 ? (
        <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <h2 className="text-sm font-semibold">Host requests</h2>
          <ul className="mt-3 space-y-2">
            {pendingHosts.map((link) => (
              <li key={link._id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{link.host?.name || "A host"}</span>
                <button
                  type="button"
                  onClick={() => acceptHost(link._id)}
                  className="rounded-full bg-[var(--kama-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Today’s cleanings</h2>
        {(groups.today || []).length === 0 ? (
          <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4 text-sm text-[var(--kama-ink-muted)]">
            No jobs today.
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.today.map((job) => (
              <li key={job._id}>
                <Link
                  href={`/cleaners/jobs/${job._id}`}
                  className="block rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-4"
                >
                  <p className="text-lg font-semibold">
                    {job.scheduledStartTime}–{job.scheduledEndTime}
                  </p>
                  <p className="text-sm">{job.propertyName}</p>
                  <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
                    {job.propertyId?.type || job.cleaningType}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat href="/cleaners/requests" label="Requests" value={(groups.requests || []).length} />
        <Stat href="/cleaners/jobs" label="Upcoming" value={(groups.upcoming || []).length} />
        <Stat href="/cleaners/jobs?scope=history" label="Done" value={(groups.completed || []).length} />
      </div>
    </div>
  );
}

function Stat({ href, label, value }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-2 py-4"
    >
      <p className="text-2xl font-semibold tabular-nums">{value || 0}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
        {label}
      </p>
    </Link>
  );
}
