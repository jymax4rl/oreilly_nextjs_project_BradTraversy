"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TYPE_LABELS, formatYmd } from "@/utils/cleaners/status";

const KINDS = [
  { id: "checkout", label: "After checkout" },
  { id: "regular", label: "Standard" },
  { id: "deep", label: "Deep" },
  { id: "emergency", label: "Urgent" },
];

export default function HostAskCleaner() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [propertyId, setPropertyId] = useState("");
  const [stayId, setStayId] = useState("");
  const [kind, setKind] = useState("checkout");
  const [cleanerId, setCleanerId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/host/cleaning/compose")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Could not load homes"));
  }, []);

  const home = useMemo(
    () => (data?.homes || []).find((item) => item._id === propertyId) || null,
    [data, propertyId],
  );

  const openStays = home?.stays?.filter((stay) => !stay.alreadyCovered) || [];
  const stay = openStays.find((item) => item._id === stayId) || null;

  useEffect(() => {
    if (!home) {
      setStayId("");
      setCleanerId("");
      return;
    }
    const nextStay = home.stays.find((item) => !item.alreadyCovered);
    setStayId(nextStay?._id || "");
    setKind(nextStay ? "checkout" : "emergency");
    const assigned = home.assignedCleanerIds?.[0] || "";
    setCleanerId(assigned);
  }, [home]);

  const windowFor = stay?.windows?.[kind] || null;
  const cleanersForHome = (data?.cleaners || []).filter((cleaner) => {
    if (!home) return false;
    if (cleaner.assignedPropertyIds.includes(home._id)) return true;
    return true;
  });
  const assigned = cleanersForHome.filter((cleaner) =>
    cleaner.assignedPropertyIds.includes(propertyId),
  );
  const others = cleanersForHome.filter(
    (cleaner) => !cleaner.assignedPropertyIds.includes(propertyId),
  );

  const send = async () => {
    if (!propertyId || !cleanerId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/host/cleaning/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          cleanerId,
          reservationId: stayId || null,
          cleaningType: kind,
          hostNotes: note,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not ask the cleaner");
      router.push(`/host/cleaning/jobs/${json.job._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!data && !error) {
    return <p className="text-sm text-[var(--kama-ink-muted)]">Loading homes…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
        Pick a home. We use the next checkout and that listing’s check-out time.
        Your cleaner gets a lock-screen alert.
      </p>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
          Home
        </h2>
        <ul className="grid gap-2">
          {(data?.homes || []).map((item) => {
            const next = item.stays.find((stayItem) => !stayItem.alreadyCovered);
            return (
              <li key={item._id}>
                <button
                  type="button"
                  onClick={() => setPropertyId(item._id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${
                    propertyId === item._id
                      ? "border-[var(--kama-accent)] bg-[var(--kama-accent-soft)]"
                      : "border-[var(--kama-border)] bg-[var(--kama-surface)]"
                  }`}
                >
                  <p className="text-base font-semibold">{item.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                    {next
                      ? `Checkout ${formatYmd(next.checkOut)} · ${item.checkOutTime}`
                      : "No upcoming checkout"}
                    {item.city ? ` · ${item.city}` : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {home ? (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
            Stay
          </h2>
          {openStays.length === 0 ? (
            <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 text-sm text-[var(--kama-ink-muted)]">
              No checkout on the calendar. We’ll send an urgent or next-day clean.
            </p>
          ) : (
            <ul className="space-y-2">
              {openStays.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setStayId(item._id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      stayId === item._id
                        ? "border-[var(--kama-accent)] bg-[var(--kama-accent-soft)]"
                        : "border-[var(--kama-border)] bg-[var(--kama-surface)]"
                    }`}
                  >
                    <p className="font-semibold">Leaves {formatYmd(item.checkOut)}</p>
                    <p className="text-xs text-[var(--kama-ink-muted)]">
                      Guest in {formatYmd(item.checkIn)}–{formatYmd(item.checkOut)} · door{" "}
                      {home.checkOutTime}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {home ? (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
            Kind
          </h2>
          <div className="flex flex-wrap gap-2">
            {KINDS.filter((item) => openStays.length > 0 || item.id !== "checkout").map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKind(item.id)}
                  className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                    kind === item.id
                      ? "bg-[var(--kama-ink)] text-white"
                      : "bg-[var(--kama-field)] text-[var(--kama-ink)]"
                  }`}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
          {windowFor ? (
            <p className="mt-3 rounded-2xl bg-[var(--kama-surface)] px-4 py-3 text-sm">
              <span className="font-semibold">
                {formatYmd(windowFor.scheduledDate)} · {windowFor.scheduledStartTime}–
                {windowFor.scheduledEndTime}
              </span>
              <span className="mt-1 block text-xs text-[var(--kama-ink-muted)]">
                {TYPE_LABELS[kind]} · {windowFor.estimatedDuration} min
                {windowFor.tightTurnaround ? " · short window before the next guest" : ""}
              </span>
            </p>
          ) : null}
        </section>
      ) : null}

      {home ? (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
            Who
          </h2>
          {data.cleaners.length === 0 ? (
            <p className="text-sm text-[var(--kama-ink-muted)]">
              Invite a cleaner first, then assign them to this home.
            </p>
          ) : (
            <ul className="space-y-2">
              {[...assigned, ...others].map((cleaner) => (
                <li key={cleaner._id}>
                  <button
                    type="button"
                    onClick={() => setCleanerId(cleaner._id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                      cleanerId === cleaner._id
                        ? "border-[var(--kama-accent)] bg-[var(--kama-accent-soft)]"
                        : "border-[var(--kama-border)] bg-[var(--kama-surface)]"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[var(--kama-field)] text-sm font-semibold">
                      {cleaner.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cleaner.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        cleaner.name.slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{cleaner.name}</span>
                      <span className="text-xs text-[var(--kama-ink-muted)]">
                        {cleaner.assignedPropertyIds.includes(propertyId)
                          ? "Cleans this home"
                          : "Trusted cleaner"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {home && cleanerId ? (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
            Note — optional
          </span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 text-sm"
            placeholder="Gate code, linen colour, anything the stay does not already say."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <button
        type="button"
        disabled={!propertyId || !cleanerId || saving}
        onClick={send}
        className="min-h-14 w-full rounded-2xl bg-[var(--kama-accent)] text-base font-semibold text-white disabled:opacity-40"
      >
        {saving ? "Sending…" : "Send to cleaner"}
      </button>
    </div>
  );
}
