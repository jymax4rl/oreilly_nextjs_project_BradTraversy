"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CLEANER_SPECIALTIES, WEEKDAYS } from "@/utils/cleaners/constants";

export default function CleanerProfileForm() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/cleaners/me")
      .then((res) => res.json())
      .then((json) => setProfile(json.profile));
  }, []);

  if (!profile) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;

  const save = async (event) => {
    event.preventDefault();
    const res = await fetch("/api/cleaners/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const json = await res.json();
    if (json.profile) {
      setProfile(json.profile);
      setMessage("Saved");
    }
  };

  const field = "w-full rounded-xl border border-[var(--kama-border)] px-3 py-3 text-sm";

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <input className={field} placeholder="First name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
        <input className={field} placeholder="Last name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
      </div>
      <textarea className={field} rows={4} placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
      <input className={field} placeholder="Location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
      <input className={field} placeholder="Languages (comma separated)" value={(profile.languages || []).join(", ")} onChange={(e) => setProfile({ ...profile, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
      <input className={field} type="number" placeholder="Years of experience" value={profile.yearsExperience} onChange={(e) => setProfile({ ...profile, yearsExperience: Number(e.target.value) })} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Specialties
        </p>
        <div className="flex flex-wrap gap-2">
          {CLEANER_SPECIALTIES.map((item) => {
            const on = (profile.specialties || []).includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const next = on
                    ? profile.specialties.filter((value) => value !== item)
                    : [...(profile.specialties || []), item];
                  setProfile({ ...profile, specialties: next });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  on ? "bg-[var(--kama-accent)] text-white" : "bg-[var(--kama-field)]"
                }`}
              >
                {item.replaceAll("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
          Weekly availability
        </p>
        {WEEKDAYS.map((day) => {
          const slot = profile.availability?.[day] || { available: true, start: "08:00", end: "18:00" };
          return (
            <div key={day} className="grid grid-cols-[7rem_1fr_1fr] items-center gap-2 text-sm">
              <label className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={slot.available}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      availability: {
                        ...profile.availability,
                        [day]: { ...slot, available: e.target.checked },
                      },
                    })
                  }
                />
                {day.slice(0, 3)}
              </label>
              <input
                type="time"
                className={field}
                value={slot.start}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    availability: { ...profile.availability, [day]: { ...slot, start: e.target.value } },
                  })
                }
              />
              <input
                type="time"
                className={field}
                value={slot.end}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    availability: { ...profile.availability, [day]: { ...slot, end: e.target.value } },
                  })
                }
              />
            </div>
          );
        })}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button type="submit" className="w-full rounded-2xl bg-[var(--kama-accent)] py-3 font-semibold text-white">
        Save profile
      </button>

      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <Link href="/cleaners/reviews" className="rounded-2xl border px-3 py-3">Reviews</Link>
        <Link href="/cleaners/earnings" className="rounded-2xl border px-3 py-3">Earnings</Link>
        <Link href="/cleaners/calendar" className="rounded-2xl border px-3 py-3">Calendar</Link>
        <Link href="/cleaners/messages" className="rounded-2xl border px-3 py-3">Messages</Link>
        <Link href="/cleaners/settings" className="rounded-2xl border px-3 py-3">Settings</Link>
      </div>
    </form>
  );
}
