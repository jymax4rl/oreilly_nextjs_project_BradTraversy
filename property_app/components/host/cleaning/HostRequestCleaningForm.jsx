"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CLEANING_TYPES } from "@/utils/cleaners/constants";
import { TYPE_LABELS } from "@/utils/cleaners/status";

export default function HostRequestCleaningForm() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    propertyId: "",
    scheduledDate: "",
    scheduledStartTime: "11:30",
    scheduledEndTime: "14:00",
    cleaningType: "checkout",
    estimatedDuration: 150,
    cleanerId: "",
    requestCleaner: true,
    hostNotes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/host/cleaning/jobs").then((res) => res.json()),
      fetch("/api/host/cleaning/cleaners").then((res) => res.json()),
    ]).then(([jobs, people]) => {
      setProperties(jobs.properties || []);
      setCleaners((people.cleaners || []).filter((link) => link.status === "active"));
    });
  }, []);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/host/cleaning/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cleanerId: form.cleanerId || null,
          requestCleaner: form.requestCleaner,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create cleaning");
      router.push(`/host/cleaning/jobs/${json.job._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Property
        </span>
        <select required className={field} value={form.propertyId} onChange={set("propertyId")}>
          <option value="">Choose a property</option>
          {properties.map((property) => (
            <option key={property._id} value={property._id}>
              {property.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
            Date
          </span>
          <input required type="date" className={field} value={form.scheduledDate} onChange={set("scheduledDate")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
            Start
          </span>
          <input type="time" className={field} value={form.scheduledStartTime} onChange={set("scheduledStartTime")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
            End
          </span>
          <input type="time" className={field} value={form.scheduledEndTime} onChange={set("scheduledEndTime")} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Cleaning type
        </span>
        <select className={field} value={form.cleaningType} onChange={set("cleaningType")}>
          {CLEANING_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Cleaner
        </span>
        <select className={field} value={form.cleanerId} onChange={set("cleanerId")}>
          <option value="">Leave unassigned</option>
          {cleaners.map((link) => (
            <option key={link._id} value={link.cleanerId._id}>
              {link.profile?.name || link.cleanerId.name}
            </option>
          ))}
        </select>
      </label>
      {form.cleanerId ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.requestCleaner}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, requestCleaner: event.target.checked }))
            }
          />
          Ask the cleaner to accept (recommended)
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Notes for the cleaner
        </span>
        <textarea className={field} rows={3} value={form.hostNotes} onChange={set("hostNotes")} />
      </label>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[var(--kama-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Sending…" : "Create cleaning"}
      </button>
    </form>
  );
}
