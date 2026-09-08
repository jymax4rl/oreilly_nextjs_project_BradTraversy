"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, Megaphone, RefreshCw } from "lucide-react";
import CreatorAvailabilityCalendar from "@/components/creators/CreatorAvailabilityCalendar";

function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function CreatorConsoleView({ initial }) {
  const [data, setData] = useState(initial);
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    initial?.properties?.[0]?.id || null,
  );
  const [availability, setAvailability] = useState(null);
  const [loadingCal, setLoadingCal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selectedProperty = useMemo(
    () =>
      (data?.properties || []).find((p) => p.id === selectedPropertyId) ||
      data?.properties?.[0] ||
      null,
    [data, selectedPropertyId],
  );

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/creators/console", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not refresh");
      setData(json);
      if (
        selectedPropertyId &&
        !(json.properties || []).some((p) => p.id === selectedPropertyId)
      ) {
        setSelectedPropertyId(json.properties?.[0]?.id || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!selectedProperty?.id) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCal(true);
      try {
        const res = await fetch(
          `/api/creators/properties/${selectedProperty.id}/availability`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Could not load calendar");
        if (!cancelled) setAvailability(json);
      } catch (err) {
        if (!cancelled) {
          setAvailability(null);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoadingCal(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProperty?.id]);

  if (data?.empty) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <Megaphone className="mx-auto h-10 w-10 text-[var(--kama-accent)]" />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--kama-ink)]">
          No partnerships yet
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          Ask your host for an invite link, or open the link they already sent —
          then sign in with Google to claim your console.
        </p>
        <Link
          href="/influencers"
          className="mt-6 inline-flex rounded-full bg-[var(--kama-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Learn about creator partnerships
        </Link>
      </main>
    );
  }

  const summary = data?.summary || {};

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--kama-accent)]">
            Creator console
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
            Your promo codes & availability
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--kama-ink-muted)]">
            Check open nights before you post stories — guests book with your
            code on Isisel.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--kama-border)] px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink-muted)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active codes", value: summary.activeCodes ?? summary.codes },
          { label: "Listings", value: summary.properties },
          { label: "Stays", value: summary.reservations },
          { label: "Paid", value: money(summary.paid) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
            <CalendarDays className="h-4 w-4" />
            Listings with your codes
          </h2>
          <ul className="space-y-2">
            {(data?.properties || []).map((p) => {
              const active = selectedProperty?.id === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-[var(--kama-accent)] bg-[var(--kama-accent-soft)]"
                        : "border-[var(--kama-border)] bg-[var(--kama-surface)] hover:border-[var(--kama-border-strong)]"
                    }`}
                  >
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-field)] text-xs font-semibold text-[var(--kama-ink-muted)]">
                        Stay
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--kama-ink)]">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--kama-ink-muted)]">
                        {[p.city, p.country].filter(Boolean).join(", ") ||
                          "Isisel listing"}
                        {" · "}
                        {p.codes
                          .map((c) => c.code)
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
              Assigned codes
            </h2>
            {(data?.partnerships || []).map((partnership) => (
              <div
                key={partnership.id}
                className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--kama-ink)]">
                  {partnership.hostName}
                </p>
                <p className="text-xs text-[var(--kama-ink-muted)]">
                  {partnership.stats.reservations} stays · accrued{" "}
                  {money(partnership.stats.accrued)}
                </p>
                <ul className="mt-3 space-y-2">
                  {partnership.codes.map((code) => (
                    <li
                      key={code.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--kama-border)] px-3 py-2"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold tracking-wide text-[var(--kama-accent)]">
                          {code.code}
                        </p>
                        <p className="text-xs text-[var(--kama-ink-muted)]">
                          {code.property?.name} · {code.commissionPercent}% ·{" "}
                          {code.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPropertyId(code.propertyId)}
                        className="text-xs font-semibold text-[var(--kama-accent)] hover:underline"
                      >
                        Calendar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {selectedProperty ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--kama-ink)]">
                    {selectedProperty.name}
                  </h2>
                  <p className="text-sm text-[var(--kama-ink-muted)]">
                    Open nights you can promote in stories · codes{" "}
                    {selectedProperty.codes.map((c) => c.code).join(", ")}
                  </p>
                </div>
                <Link
                  href={`/properties/${selectedProperty.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--kama-accent)] hover:underline"
                >
                  View listing
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {loadingCal ? (
                <p className="rounded-2xl border border-[var(--kama-border)] px-4 py-10 text-center text-sm text-[var(--kama-ink-muted)]">
                  Loading calendar…
                </p>
              ) : (
                <CreatorAvailabilityCalendar
                  propertyName={selectedProperty.name}
                  unavailableRanges={
                    availability?.unavailableRanges || []
                  }
                />
              )}

              <p className="text-xs leading-relaxed text-[var(--kama-ink-muted)]">
                Tip: promote dates that show as open. When a guest books with your
                code, the stay appears in your earnings after checkout.
              </p>
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--kama-border-strong)] px-4 py-12 text-center text-sm text-[var(--kama-ink-muted)]">
              Select a listing to see its Isisel availability calendar.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
