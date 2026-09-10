"use client";

import { useMemo, useState } from "react";
import {
  CANCELLATION_PRESET_IDS,
  describeCancellationPolicy,
  hostDefaultToBookingPolicy,
} from "@/utils/bookings/bookingPolicy";

const PRESET_OPTIONS = [
  {
    id: "none",
    label: "No free cancellation",
  },
  {
    id: "12",
    label: "12 hours before check-in",
  },
  {
    id: "24",
    label: "24 hours before check-in",
  },
  {
    id: "48",
    label: "48 hours before check-in",
  },
  {
    id: "72",
    label: "72 hours before check-in",
  },
  {
    id: "custom",
    label: "Custom window…",
  },
];

/**
 * Host Settings: default free-cancellation window for new reservations.
 * Existing bookings keep the policy snapshotted at create time.
 */
export default function HostCancellationPolicyForm({ initialPolicy }) {
  const [preset, setPreset] = useState(initialPolicy?.preset || "48");
  const [customHours, setCustomHours] = useState(
    initialPolicy?.customHours ?? 48,
  );
  const [timeZone, setTimeZone] = useState(initialPolicy?.timeZone || "UTC");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const preview = useMemo(() => {
    const policy = hostDefaultToBookingPolicy({
      preset: CANCELLATION_PRESET_IDS.includes(preset) ? preset : "48",
      customHours,
      timeZone,
    });
    return describeCancellationPolicy(policy);
  }, [preset, customHours, timeZone]);

  async function onSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCancellationPolicy: {
            preset,
            customHours: Number(customHours),
            timeZone,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || "Could not save policy");
      }
      setMessage("Saved. New reservations will use this window.");
    } catch (err) {
      setError(err.message || "Could not save policy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
        Guests see this before they request a stay. Changing it later does not
        rewrite reservations already on the books — each booking stores its own
        copy.
      </p>

      <label className="block">
        <span className="text-sm font-medium text-[var(--kama-ink)]">
          Free cancellation until
        </span>
        <select
          className="mt-1.5 w-full rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2.5 text-sm text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)]"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {preset === "custom" ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--kama-ink)]">
            Custom hours before check-in
          </span>
          <input
            type="number"
            min={1}
            max={8760}
            className="mt-1.5 w-full rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--kama-accent)]"
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            required
          />
        </label>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-[var(--kama-ink)]">
          Check-in time zone
        </span>
        <input
          type="text"
          className="mt-1.5 w-full rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--kama-accent)]"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          placeholder="e.g. Africa/Dakar"
          list="isisel-host-timezones"
        />
        <datalist id="isisel-host-timezones">
          <option value="UTC" />
          <option value="Africa/Dakar" />
          <option value="Africa/Abidjan" />
          <option value="Africa/Accra" />
          <option value="Africa/Lagos" />
          <option value="Africa/Nairobi" />
          <option value="Africa/Johannesburg" />
          <option value="Europe/Paris" />
        </datalist>
        <span className="mt-1 block text-xs text-[var(--kama-ink-muted)]">
          Cutoffs use local midnight of check-in day in this zone, so 24h and
          48h windows stay correct across countries.
        </span>
      </label>

      <p className="rounded-xl bg-[var(--kama-field)] px-3 py-2.5 text-sm text-[var(--kama-ink)]">
        <span className="font-medium">Guest will see:</span> {preview}
      </p>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--kama-accent)]" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save cancellation policy"}
      </button>
    </form>
  );
}
