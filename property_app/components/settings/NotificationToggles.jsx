"use client";

import { useState } from "react";

/**
 * Persistable notification toggles via PATCH /api/user/settings.
 * Parent decides which keys to show (role-gated).
 */
export default function NotificationToggles({
  initialNotifications,
  visibleKeys,
}) {
  const [prefs, setPrefs] = useState(
    () => initialNotifications || {
      bookingUpdates: true,
      hostNewBookings: true,
      hostBookingChanges: true,
    },
  );
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");
  const [savedKey, setSavedKey] = useState("");

  const labels = {
    bookingUpdates: {
      title: "Trip updates",
      description:
        "Email when a booking is confirmed, dates change, or a stay is cancelled.",
    },
    hostNewBookings: {
      title: "New reservations",
      description:
        "Email when a guest books one of your listings (after payment).",
    },
    hostBookingChanges: {
      title: "Reservation changes",
      description:
        "Email when a guest modifies dates or cancels a stay on your property.",
    },
  };

  const toggle = async (key) => {
    const next = !prefs[key];
    const previous = prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSavingKey(key);
    setError("");
    setSavedKey("");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: { [key]: next } }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Could not save");
      }
      const data = await res.json();
      if (data.settings?.preferences?.notifications) {
        setPrefs(data.settings.preferences.notifications);
      }
      setSavedKey(key);
      setTimeout(() => setSavedKey(""), 1800);
    } catch (err) {
      setPrefs((p) => ({ ...p, [key]: previous }));
      setError(err.message || "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-1">
      {visibleKeys.map((key) => {
        const meta = labels[key];
        if (!meta) return null;
        const on = !!prefs[key];
        return (
          <div
            key={key}
            className="flex items-start justify-between gap-4 border-b border-[var(--kama-border)] py-3.5 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--kama-ink)]">{meta.title}</p>
              <p className="mt-0.5 text-sm text-[var(--kama-ink-muted)]">
                {meta.description}
              </p>
              {savedKey === key && (
                <p className="mt-1 text-xs font-medium text-[var(--kama-accent)]">
                  Saved
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={meta.title}
              disabled={savingKey === key}
              onClick={() => toggle(key)}
              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kama-accent)]/30 disabled:opacity-60 ${
                on ? "bg-[var(--kama-accent)]" : "bg-[var(--kama-border-strong)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  on ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
      {error && (
        <p className="pt-2 text-sm text-[var(--kama-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
