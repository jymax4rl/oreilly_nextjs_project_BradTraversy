"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const POLL_MS = 20_000;

function loadClass(id) {
  switch (id) {
    case "hot":
      return "bg-red-100 text-red-800";
    case "busy":
      return "bg-amber-100 text-amber-900";
    case "comfortable":
      return "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function pingLabel(ms) {
  if (ms == null) return "—";
  return `${ms} ms`;
}

function pingTone(ms) {
  if (ms == null) return "text-[var(--kama-ink-muted)]";
  if (ms >= 500) return "text-red-700";
  if (ms >= 200) return "text-amber-800";
  return "text-[var(--kama-ink)]";
}

export default function OpsTrafficPanel() {
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/traffic?nc=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load traffic");
      }
      const data = await res.json();
      setTraffic(data.traffic || null);
    } catch {
      setError("Could not load live traffic.");
      if (!silent) setTraffic(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const cards = [
    {
      label: "Active now",
      value: traffic?.activeNow,
      note: `Open in the last ${traffic?.windowSeconds ? traffic.windowSeconds / 60 : 5} min`,
    },
    {
      label: "Visitors today",
      value: traffic?.visitorsToday,
      note: `of ${Number(traffic?.dailyTarget || 3000).toLocaleString()} planning target`,
    },
    {
      label: "Page views today",
      value: traffic?.viewsToday,
      note: "Each navigation, not heartbeats",
    },
    {
      label: "Mongo ping",
      valueNode: (
        <span className={pingTone(traffic?.mongoPingMs)}>
          {loading && traffic == null ? "…" : pingLabel(traffic?.mongoPingMs)}
        </span>
      ),
      note:
        traffic?.mongoReadyState === 1
          ? "Atlas reachable from this instance"
          : "Not connected",
    },
  ];

  const pct = Math.min(100, Number(traffic?.ofTargetPct) || 0);
  const loadMeta = traffic?.load;

  return (
    <section className="mt-10" aria-labelledby="ops-traffic-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="ops-traffic-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
          >
            Live traffic
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--kama-ink-muted)]">
            Anonymous browser probes (no IPs). Use this to see whether the
            marketplace is still well under the 3,000-visitor planning target.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadMeta ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${loadClass(
                loadMeta.id,
              )}`}
            >
              {loadMeta.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-border-strong)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)] disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : undefined}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-5"
          >
            <p className="text-xs font-medium text-[var(--kama-ink-muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--kama-ink)]">
              {card.valueNode
                ? card.valueNode
                : loading && traffic == null
                  ? "…"
                  : card.value == null
                    ? "—"
                    : card.value.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-[var(--kama-ink-muted)]">
              {card.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-[var(--kama-ink)]">
            Daily unique visitors
          </p>
          <p className="text-xs tabular-nums text-[var(--kama-ink-muted)]">
            {traffic
              ? `${(traffic.visitorsToday || 0).toLocaleString()} / ${(traffic.dailyTarget || 3000).toLocaleString()}`
              : "—"}
          </p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--kama-field)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Share of 3,000 daily visitor target"
        >
          <div
            className="h-full rounded-full bg-[var(--kama-accent)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {loadMeta?.hint ? (
          <p className="mt-2 text-xs text-[var(--kama-ink-muted)]">
            {loadMeta.hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
