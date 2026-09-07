"use client";

import { useEffect, useState } from "react";

export default function HostPropertySettings() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState("");
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/host/cleaning/jobs")
      .then((res) => res.json())
      .then((json) => setProperties(json.properties || []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/host/cleaning/properties/${selected}/settings`)
      .then((res) => res.json())
      .then((json) => setSettings(json.settings));
  }, [selected]);

  const save = async (event) => {
    event.preventDefault();
    const res = await fetch(`/api/host/cleaning/properties/${selected}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (json.settings) {
      setSettings(json.settings);
      setMessage("Saved");
    }
  };

  const field =
    "w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 text-sm";

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-[var(--kama-ink-muted)]">
        Permanent instructions and the checklist that appear on every cleaning for a property.
      </p>
      <select className={field} value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Choose a property</option>
        {properties.map((property) => (
          <option key={property._id} value={property._id}>
            {property.name}
          </option>
        ))}
      </select>
      {settings ? (
        <form onSubmit={save} className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.autoCreateOnCheckout !== false}
              onChange={(e) =>
                setSettings({ ...settings, autoCreateOnCheckout: e.target.checked })
              }
            />
            Create a cleaning automatically after every confirmed checkout
          </label>
          <label className="block text-sm">
            Default duration (minutes)
            <input
              type="number"
              className={`${field} mt-1`}
              value={settings.estimatedMinutes || 150}
              onChange={(e) =>
                setSettings({ ...settings, estimatedMinutes: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-sm">
            Instructions
            <textarea
              className={`${field} mt-1`}
              rows={5}
              value={settings.instructions || ""}
              onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Checklist
            </p>
            {(settings.checklist || []).map((item, index) => (
              <input
                key={item.key || index}
                className={field}
                value={item.label}
                onChange={(e) => {
                  const checklist = [...settings.checklist];
                  checklist[index] = { ...item, label: e.target.value };
                  setSettings({ ...settings, checklist });
                }}
              />
            ))}
          </div>
          {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
          <button
            type="submit"
            className="rounded-full bg-[var(--kama-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save settings
          </button>
        </form>
      ) : null}
    </div>
  );
}
