"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Check, X } from "lucide-react";

/**
 * Inline edit for display name via PATCH /api/user/profile.
 * Triggers session update so Navbar reflects the new name.
 */
export default function ProfileDisplayNameForm({ initialName }) {
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState(initialName || "");

  const cancel = () => {
    setName(displayName);
    setError("");
    setEditing(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2 || trimmed.length > 80) {
      setError("Name must be 2–80 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }
      const data = await res.json();
      const next = data.profile?.name || trimmed;
      setDisplayName(next);
      setName(next);
      setEditing(false);
      // Refresh JWT so menu chrome picks up the Google profile name sync path
      await update();
    } catch (err) {
      setError(err.message || "Could not save name");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--kama-ink)] sm:text-3xl">
          {displayName || "Your profile"}
        </h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="kama-focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--kama-accent)] hover:bg-[var(--kama-accent-soft)]"
          aria-label="Edit display name"
        >
          <Pencil size={14} aria-hidden />
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex w-full max-w-md flex-col gap-2">
      <label htmlFor="profile-display-name" className="sr-only">
        Display name
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="profile-display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={saving}
          className="kama-focus-ring min-w-0 flex-1 rounded-xl border border-[var(--kama-border-strong)] bg-[var(--kama-surface)] px-3 py-2 text-lg font-semibold text-[var(--kama-ink)]"
          autoFocus
        />
        <button
          type="submit"
          disabled={saving}
          className="kama-cta kama-focus-ring inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <Check size={16} aria-hidden />
          Save
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="kama-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 text-sm font-medium text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)]"
        >
          <X size={16} aria-hidden />
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-sm text-[var(--kama-danger)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
