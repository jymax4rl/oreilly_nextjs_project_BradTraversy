"use client";

import { useEffect, useState } from "react";

export default function HostCleanersList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");

  const load = () =>
    fetch("/api/host/cleaning/cleaners")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      });

  useEffect(() => {
    load().catch(() => setError("Could not load cleaners"));
  }, []);

  const sendInvite = async (event) => {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/host/cleaning/cleaners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Invite failed");
      return;
    }
    setInvite({ name: "", email: "", phone: "" });
    setMessage(
      json.mode === "relationship_request"
        ? "This cleaner already has an Isisel account. We sent them a relationship request."
        : "Invitation sent.",
    );
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this cleaner from your trusted list? Their Isisel account stays.")) {
      return;
    }
    await fetch(`/api/host/cleaning/cleaners/${id}`, { method: "DELETE" });
    load();
  };

  const field =
    "w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2">
        {!data ? (
          <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>
        ) : data.cleaners.length === 0 ? (
          <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6 text-sm text-[var(--kama-ink-muted)]">
            Invite a cleaner to get started. They keep their own Isisel account and can work with other hosts.
          </p>
        ) : (
          data.cleaners.map((link) => (
            <article
              key={link._id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
            >
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[var(--kama-accent-soft)] text-xs font-semibold text-[var(--kama-accent)]">
                {link.cleanerId.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.cleanerId.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (link.profile?.name || link.cleanerId.name || "?").slice(0, 1)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {link.profile?.name || link.cleanerId.name}
                </p>
                <p className="text-xs text-[var(--kama-ink-muted)]">
                  {link.status} · {link.completedCleanings} completed ·{" "}
                  {link.profile?.ratingAverage
                    ? `${link.profile.ratingAverage.toFixed(1)}★`
                    : "No reviews"}
                </p>
              </div>
              {link.status !== "inactive" ? (
                <button
                  type="button"
                  onClick={() => remove(link._id)}
                  className="text-xs font-medium text-[var(--kama-ink-muted)] hover:text-rose-700"
                >
                  Remove
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
      <form
        onSubmit={sendInvite}
        className="h-fit space-y-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
      >
        <h2 className="text-sm font-semibold">Invite a cleaner</h2>
        <input className={field} placeholder="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} required />
        <input className={field} type="email" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
        <input className={field} placeholder="Phone" value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} />
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--kama-accent)] py-2.5 text-sm font-semibold text-white"
        >
          Send invite
        </button>
      </form>
    </div>
  );
}
