"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import GlowBarChart from "@/components/ops/charts/GlowBarChart";
import SmoothAreaChart from "@/components/ops/charts/SmoothAreaChart";
import OpsLiveMap from "@/components/ops/OpsLiveMap";
import "@/components/ops/charts/ops-charts.css";

const POLL_MS = 20_000;

function loadClass(id) {
  switch (id) {
    case "hot":
      return "bg-red-50 text-red-700";
    case "busy":
      return "bg-amber-50 text-amber-800";
    case "comfortable":
      return "bg-emerald-50 text-emerald-800";
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
  if (ms >= 500) return "text-red-600";
  if (ms >= 200) return "text-amber-600";
  return "text-emerald-600";
}

function pingDot(ms) {
  if (ms == null) return "ops-status-dot--idle";
  if (ms >= 500) return "ops-status-dot--bad";
  if (ms >= 200) return "ops-status-dot--warn";
  return "ops-status-dot--ok";
}

function weekdayLabel(isoDay) {
  if (!isoDay) return "";
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
}

function countryLabel(code) {
  if (!code || code === "ZZ") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
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

  const display = (value) =>
    loading && traffic == null
      ? "…"
      : value == null
        ? "—"
        : Number(value).toLocaleString();

  const pct = Math.min(100, Number(traffic?.ofTargetPct) || 0);
  const loadMeta = traffic?.load;
  const days7 = traffic?.days7 || [];
  const history = traffic?.history;
  const places = history?.places || [];

  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="ops-traffic-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="ops-traffic-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
          >
            Live traffic
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--kama-ink-muted)]">
            Anonymous browser probes (no IPs). Live view is the last 5 minutes;
            visitor and city totals below persist so you can see how many
            people have come and from where.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadMeta ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${loadClass(
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
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--kama-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink)] transition hover:border-[var(--kama-border-strong)] disabled:opacity-60"
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
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="ops-card">
          <p className="ops-card-label">Active now</p>
          <p className="ops-card-value">{display(traffic?.activeNow)}</p>
          <p className="ops-card-note">
            Open in the last{" "}
            {traffic?.windowSeconds ? traffic.windowSeconds / 60 : 5} min
          </p>
        </article>

        <article className="ops-card ops-card--accent">
          <p className="ops-card-label">Visitors today</p>
          <p className="ops-card-value">{display(traffic?.visitorsToday)}</p>
          <p className="ops-card-note">
            of {Number(traffic?.dailyTarget || 3000).toLocaleString()} planning
            target
          </p>
        </article>

        <article className="ops-card">
          <p className="ops-card-label">Page views today</p>
          <p className="ops-card-value">{display(traffic?.viewsToday)}</p>
          <p className="ops-card-note">Each navigation, not heartbeats</p>
        </article>

        <article className="ops-card">
          <p className="ops-card-label">Mongo ping</p>
          <p className={`ops-card-value ${pingTone(traffic?.mongoPingMs)}`}>
            {loading && traffic == null ? "…" : pingLabel(traffic?.mongoPingMs)}
          </p>
          <p className="ops-card-note inline-flex items-center gap-1.5">
            <span
              className={`ops-status-dot ${pingDot(traffic?.mongoPingMs)}`}
              aria-hidden
            />
            {traffic?.mongoReadyState === 1
              ? "Atlas reachable"
              : "Not connected"}
          </p>
        </article>
      </div>

      <div className="mt-4">
        <OpsLiveMap
          dots={traffic?.live || []}
          historyDots={traffic?.historyDots || []}
          activeCount={traffic?.activeNow}
        />
      </div>

      <div className="ops-card mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="ops-chart-title">Daily unique visitors</p>
          <p className="text-xs tabular-nums text-[var(--kama-ink-muted)]">
            {traffic
              ? `${(traffic.visitorsToday || 0).toLocaleString()} / ${(traffic.dailyTarget || 3000).toLocaleString()}`
              : "—"}
          </p>
        </div>
        <div
          className="ops-progress-track mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Share of 3,000 daily visitor target"
        >
          <div className="ops-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {loadMeta?.hint ? (
          <p className="mt-2 text-xs text-[var(--kama-ink-muted)]">
            {loadMeta.hint}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SmoothAreaChart
            series={traffic?.series || []}
            label="Views over time"
          />
        </div>
        <div className="lg:col-span-2">
          <GlowBarChart
            label="Now vs today"
            subtitle="Live · unique · views"
            bars={[
              { label: "Active", value: traffic?.activeNow, tone: "green" },
              { label: "Visitors", value: traffic?.visitorsToday, tone: "teal" },
              { label: "Views", value: traffic?.viewsToday, tone: "ink" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlowBarChart
          label="Unique browsers this week"
          subtitle="Once per UTC day"
          emptyHint="Unique counts start as guests browse after this update."
          bars={days7.map((d, i) => ({
            label: weekdayLabel(d.t),
            value: d.visitors,
            tone: i === days7.length - 1 ? "stripe" : "teal",
          }))}
        />
        <GlowBarChart
          label="Views this week"
          subtitle="UTC days"
          emptyHint="Daily totals appear after guests browse public pages."
          bars={days7.map((d, i) => ({
            label: weekdayLabel(d.t),
            value: d.views,
            tone: i === days7.length - 1 ? "stripe" : "ink",
          }))}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
          Visitor history
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--kama-ink-muted)]">
          City-level only, no IPs. Returning guests count once per UTC day, so
          a 7-day total can be higher than distinct people. Unique history
          starts from this update; page views already go back further.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="ops-card ops-card--accent">
          <p className="ops-card-label">Unique browsers · 7 days</p>
          <p className="ops-card-value">{display(history?.visitors7)}</p>
          <p className="ops-card-note">Sum of daily uniques (UTC)</p>
        </article>
        <article className="ops-card">
          <p className="ops-card-label">Unique browsers · 30 days</p>
          <p className="ops-card-value">{display(history?.visitors30)}</p>
          <p className="ops-card-note">Same sid on two days counts twice</p>
        </article>
        <article className="ops-card">
          <p className="ops-card-label">Page views · 30 days</p>
          <p className="ops-card-value">{display(history?.views30)}</p>
          <p className="ops-card-note">Navigations, not open tabs</p>
        </article>
        <article className="ops-card">
          <p className="ops-card-label">Places</p>
          <p className="ops-card-value">{display(history?.placeCount)}</p>
          <p className="ops-card-note">Cities with at least one visitor</p>
        </article>
      </div>

      <div className="ops-card mt-4 overflow-x-auto">
        <p className="ops-chart-title">Where visitors came from</p>
        <p className="ops-chart-sub mt-1">
          Last 30 days · top cities by unique browsers
        </p>
        {places.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--kama-ink-muted)]">
            Locations appear after guests browse with city-level geo (production
            edge headers, or timezone on localhost).
          </p>
        ) : (
          <table className="ops-places-table mt-3">
            <thead>
              <tr>
                <th className="text-left">Country</th>
                <th className="text-left">City</th>
                <th className="text-right">Visitors</th>
                <th className="text-right">Views</th>
              </tr>
            </thead>
            <tbody>
              {places.map((row) => (
                <tr key={`${row.country}|${row.city}`}>
                  <td>{countryLabel(row.country)}</td>
                  <td>{row.city || "—"}</td>
                  <td className="text-right tabular-nums font-semibold">
                    {(Number(row.visitors) || 0).toLocaleString()}
                  </td>
                  <td className="text-right tabular-nums text-[var(--kama-ink-muted)]">
                    {(Number(row.views) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
