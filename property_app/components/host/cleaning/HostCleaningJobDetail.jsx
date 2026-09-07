"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { TYPE_LABELS, formatYmd } from "@/utils/cleaners/status";

export default function HostCleaningJobDetail({ jobId }) {
  const [job, setJob] = useState(null);
  const [cleaners, setCleaners] = useState([]);
  const [error, setError] = useState("");
  const [review, setReview] = useState({ overall: 5, text: "" });
  const [assignId, setAssignId] = useState("");

  const load = useCallback(
    () =>
      fetch(`/api/host/cleaning/jobs/${jobId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) setError(json.error);
          else setJob(json.job);
        }),
    [jobId],
  );

  useEffect(() => {
    load();
    fetch("/api/host/cleaning/cleaners")
      .then((res) => res.json())
      .then((json) =>
        setCleaners((json.cleaners || []).filter((link) => link.status === "active")),
      );
  }, [jobId, load]);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!job) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;

  const assign = async () => {
    if (!assignId) return;
    const res = await fetch(`/api/host/cleaning/jobs/${jobId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanerId: assignId, requestCleaner: true }),
    });
    const json = await res.json();
    if (json.job) setJob(json.job);
    else setError(json.error || "Could not assign");
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this cleaning?")) return;
    const res = await fetch(`/api/host/cleaning/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const json = await res.json();
    if (json.job) setJob(json.job);
  };

  const sendReview = async (event) => {
    event.preventDefault();
    const res = await fetch(`/api/host/cleaning/jobs/${jobId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error || "Review failed");
    else setError("");
  };

  const done = (job.checklist || []).filter((item) => item.done).length;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{job.propertyName}</h2>
            <p className="text-sm text-[var(--kama-ink-muted)]">
              {formatYmd(job.scheduledDate)} · {job.scheduledStartTime}–{job.scheduledEndTime}
            </p>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              {TYPE_LABELS[job.cleaningType]} · Checkout {job.checkoutTime || "—"}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <p className="mt-3 text-sm">
          Cleaner: {job.cleanerId?.name || job.requestedCleanerId?.name || "Unassigned"}
        </p>
      </header>

      {!job.cleanerId && job.status !== "cancelled" ? (
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <label className="min-w-[200px] flex-1 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-[var(--kama-ink-muted)]">
              Assign a cleaner
            </span>
            <select
              className="w-full rounded-xl border border-[var(--kama-border)] px-3 py-2"
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
            >
              <option value="">Choose…</option>
              {cleaners.map((link) => (
                <option key={link._id} value={link.cleanerId._id}>
                  {link.profile?.name || link.cleanerId.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={assign}
            className="rounded-full bg-[var(--kama-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Request
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
        <h3 className="text-sm font-semibold">Instructions</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--kama-ink-muted)]">
          {job.propertyInstructions || "No permanent instructions yet."}
        </p>
        {job.hostNotes ? (
          <p className="mt-2 whitespace-pre-wrap text-sm">{job.hostNotes}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
        <h3 className="text-sm font-semibold">
          Checklist · {done}/{job.checklist?.length || 0}
        </h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(job.checklist || []).map((item) => (
            <li key={item.key} className={item.done ? "text-[var(--kama-ink)]" : "text-[var(--kama-ink-muted)]"}>
              {item.done ? "☑" : "☐"} {item.label}
            </li>
          ))}
        </ul>
      </section>

      {(job.photos || []).length > 0 ? (
        <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <h3 className="text-sm font-semibold">Photos</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {job.photos.map((photo) => (
              <a key={photo._id || photo.url} href={photo.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-32 w-full rounded-xl object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {(job.audioReports || []).length > 0 ? (
        <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <h3 className="text-sm font-semibold">Audio reports</h3>
          <ul className="mt-3 space-y-3">
            {job.audioReports.map((audio) => (
              <li key={audio._id || audio.url}>
                <audio controls src={audio.url} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(job.issueReports || []).length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <h3 className="text-sm font-semibold text-rose-900">Issues</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {job.issueReports.map((issue) => (
              <li key={issue._id}>
                <strong className="capitalize">{issue.type?.replaceAll("_", " ")}</strong>
                {issue.note ? ` — ${issue.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.cleanerNotes ? (
        <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <h3 className="text-sm font-semibold">Cleaner notes</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{job.cleanerNotes}</p>
        </section>
      ) : null}

      {["completed", "issue_reported"].includes(job.status) && job.cleanerId ? (
        <form
          onSubmit={sendReview}
          className="space-y-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
        >
          <h3 className="text-sm font-semibold">Review this cleaner</h3>
          <label className="block text-sm">
            Overall
            <input
              type="number"
              min="1"
              max="5"
              className="ml-2 w-16 rounded-lg border px-2 py-1"
              value={review.overall}
              onChange={(e) => setReview({ ...review, overall: Number(e.target.value) })}
            />
          </label>
          <textarea
            className="w-full rounded-xl border px-3 py-2 text-sm"
            rows={3}
            placeholder="Optional written review"
            value={review.text}
            onChange={(e) => setReview({ ...review, text: e.target.value })}
          />
          <button type="submit" className="rounded-full bg-[var(--kama-ink)] px-4 py-2 text-sm font-semibold text-white">
            Save review
          </button>
        </form>
      ) : null}

      {job.status !== "cancelled" && job.status !== "completed" ? (
        <button type="button" onClick={cancel} className="text-sm text-rose-700">
          Cancel cleaning
        </button>
      ) : null}
    </div>
  );
}
