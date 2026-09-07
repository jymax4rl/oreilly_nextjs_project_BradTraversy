"use client";

import { useCallback, useEffect, useState } from "react";
import AudioRecorder from "@/components/cleaners/AudioRecorder";
import StatusBadge from "@/components/cleaning/StatusBadge";
import { ISSUE_TYPES } from "@/utils/cleaners/constants";
import { TYPE_LABELS, formatYmd } from "@/utils/cleaners/status";

export default function CleanerJobDetail({ jobId }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [issueType, setIssueType] = useState("maintenance");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/cleaners/jobs/${jobId}`);
    const json = await res.json();
    if (!res.ok) setError(json.error || "Could not load cleaning");
    else {
      setJob(json.job);
      setNote(json.job.cleanerNotes || "");
    }
  }, [jobId]);

  useEffect(() => {
    load().catch(() => setError("Could not load cleaning"));
  }, [load]);

  const act = async (path, body) => {
    setBusy(path);
    setError("");
    const res = await fetch(`/api/cleaners/jobs/${jobId}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    setBusy("");
    if (!res.ok) {
      setError(json.error || "That did not work");
      return;
    }
    if (json.job) setJob(json.job);
    else load();
  };

  const toggleItem = async (item) => {
    await fetch(`/api/cleaners/jobs/${jobId}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: item.key, done: !item.done }),
    });
    load();
  };

  const uploadPhoto = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setBusy("photos");
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("photo", file);
        const res = await fetch(`/api/cleaners/jobs/${jobId}/photos`, {
          method: "POST",
          body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Photo upload failed");
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
      event.target.value = "";
    }
  };

  const saveAudio = async (blob, meta) => {
    const form = new FormData();
    form.append("audio", blob, `report.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
    form.append("duration", String(meta.duration || 0));
    const res = await fetch(`/api/cleaners/jobs/${jobId}/audio`, {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Audio upload failed");
    await load();
  };

  const saveNote = async () => {
    await fetch(`/api/cleaners/jobs/${jobId}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanerNotes: note }),
    });
  };

  const reportIssue = async () => {
    await act("issues", { type: issueType, note });
  };

  if (error && !job) return <p className="text-sm text-rose-700">{error}</p>;
  if (!job) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;

  const canStart = ["accepted", "scheduled", "en_route"].includes(job.status);
  const inProgress = ["in_progress", "issue_reported"].includes(job.status);
  const done = (job.checklist || []).filter((item) => item.done).length;
  const mapQuery = encodeURIComponent(job.propertyAddress || job.propertyName || "");

  return (
    <div className="space-y-4 pb-8">
      <header className="rounded-3xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
        <StatusBadge status={job.status} />
        <h1 className="mt-3 text-2xl font-semibold leading-tight">{job.propertyName}</h1>
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">{job.propertyAddress}</p>
        <p className="mt-3 text-sm">
          {formatYmd(job.scheduledDate)}
          <br />
          Checkout {job.checkoutTime || "—"}
          <br />
          Cleaning {job.scheduledStartTime}–{job.scheduledEndTime}
        </p>
        <p className="mt-2 text-xs uppercase tracking-wide text-[var(--kama-ink-muted)]">
          {TYPE_LABELS[job.cleaningType]} · {job.estimatedDuration} min
        </p>
        {job.hostId?.name ? (
          <p className="mt-2 text-sm">Host: {job.hostId.name}</p>
        ) : null}
        {mapQuery ? (
          <a
            href={`https://maps.google.com/?q=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--kama-accent)]"
          >
            Open map
          </a>
        ) : null}
      </header>

      {job.status === "requested" ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => act("decline")}
            className="rounded-2xl bg-[var(--kama-field)] py-4 text-base font-semibold"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => act("accept")}
            className="rounded-2xl bg-[var(--kama-accent)] py-4 text-base font-semibold text-white"
          >
            Accept
          </button>
        </div>
      ) : null}

      {canStart ? (
        <button
          type="button"
          disabled={busy === "start"}
          onClick={() => act("start")}
          className="w-full rounded-2xl bg-[var(--kama-accent)] py-5 text-lg font-semibold text-white"
        >
          Start cleaning
        </button>
      ) : null}

      {inProgress ? (
        <button
          type="button"
          disabled={busy === "complete"}
          onClick={() => act("complete", { cleanerNotes: note })}
          className="w-full rounded-2xl bg-[var(--kama-ink)] py-5 text-lg font-semibold text-white"
        >
          Complete cleaning
        </button>
      ) : null}

      {job.propertyInstructions ? (
        <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <h2 className="text-sm font-semibold">Property instructions</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {job.propertyInstructions}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
        <h2 className="text-sm font-semibold">
          Checklist · {done}/{job.checklist?.length || 0}
        </h2>
        <ul className="mt-3 space-y-2">
          {(job.checklist || []).map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--kama-field)] px-3 py-3 text-left text-sm"
              >
                <span className="text-lg">{item.done ? "☑" : "☐"}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Report</h2>
        <label className="flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--kama-border-strong)] bg-[var(--kama-surface)] px-4 py-5 text-base font-semibold">
          📷 Add photos
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="sr-only"
            onChange={uploadPhoto}
          />
        </label>
        {(job.photos || []).length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {job.photos.map((photo) => (
              <a key={photo._id || photo.url} href={photo.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-24 w-full rounded-xl object-cover" />
              </a>
            ))}
          </div>
        ) : null}
        {busy === "photos" ? (
          <p className="text-sm text-[var(--kama-ink-muted)]">Uploading photos…</p>
        ) : null}

        <AudioRecorder onSave={saveAudio} />
        {(job.audioReports || []).map((audio) => (
          <audio key={audio._id || audio.url} controls src={audio.url} className="w-full" />
        ))}

        <textarea
          className="w-full rounded-2xl border border-[var(--kama-border)] px-3 py-3 text-sm"
          rows={3}
          placeholder="Written note — optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
        />
      </section>

      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
        <h2 className="text-sm font-semibold">Report an issue</h2>
        <select
          className="mt-2 w-full rounded-xl border px-3 py-3 text-sm"
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
        >
          {ISSUE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={reportIssue}
          className="mt-3 w-full rounded-2xl bg-rose-700 py-3 text-sm font-semibold text-white"
        >
          Report issue
        </button>
      </section>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
