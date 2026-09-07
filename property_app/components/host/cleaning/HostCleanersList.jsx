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
        ? "They already have an Isisel account. We asked them to join your list."
        : "Invitation sent.",
    );
    load();
  };

  const toggleHome = async (link, propertyId) => {
    const current = (link.assignedPropertyIds || []).map((item) =>
      typeof item === "object" ? item._id : item,
    );
    const next = current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    await fetch(`/api/host/cleaning/cleaners/${link._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedPropertyIds: next }),
    });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Remove from your trusted list? Their Isisel account stays.")) {
      return;
    }
    await fetch(`/api/host/cleaning/cleaners/${id}`, { method: "DELETE" });
    load();
  };

  const field =
    "min-h-12 w-full rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 text-sm";

  return (
    <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <p className="text-sm text-[var(--kama-ink-muted)]">
          Assign a cleaner to a home. After that, asking them to clean uses the next checkout automatically.
        </p>
        {!data ? (
          <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>
        ) : data.cleaners.length === 0 ? (
          <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 text-sm text-[var(--kama-ink-muted)]">
            Invite someone. They keep their own account and can work for other hosts too.
          </p>
        ) : (
          data.cleaners
            .filter((link) => link.status !== "inactive")
            .map((link) => {
              const assigned = (link.assignedPropertyIds || []).map((item) =>
                typeof item === "object" ? item._id : item,
              );
              return (
                <article
                  key={link._id}
                  className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[var(--kama-accent-soft)] text-sm font-semibold text-[var(--kama-accent)]">
                      {link.cleanerId.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={link.cleanerId.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (link.profile?.name || link.cleanerId.name || "?").slice(0, 1)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {link.profile?.name || link.cleanerId.name}
                      </p>
                      <p className="text-xs text-[var(--kama-ink-muted)]">
                        {link.completedCleanings || 0} cleanings
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(link._id)}
                      className="text-xs text-[var(--kama-ink-muted)]"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
                    Cleans
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(data.properties || []).map((property) => {
                      const on = assigned.includes(property._id);
                      return (
                        <button
                          key={property._id}
                          type="button"
                          onClick={() => toggleHome(link, property._id)}
                          className={`min-h-10 rounded-full px-3 text-xs font-semibold ${
                            on
                              ? "bg-[var(--kama-accent)] text-white"
                              : "bg-[var(--kama-field)] text-[var(--kama-ink)]"
                          }`}
                        >
                          {property.name}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })
        )}
      </div>
      <form
        onSubmit={sendInvite}
        className="h-fit space-y-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
      >
        <h2 className="text-sm font-semibold">Invite</h2>
        <input className={field} placeholder="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} required />
        <input className={field} type="email" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
        <input className={field} placeholder="Phone" value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} />
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          className="min-h-12 w-full rounded-2xl bg-[var(--kama-accent)] text-sm font-semibold text-white"
        >
          Send invite
        </button>
      </form>
    </div>
  );
}
