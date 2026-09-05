"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SmoothAreaChart from "@/components/ops/charts/SmoothAreaChart";
import GlowBarChart from "@/components/ops/charts/GlowBarChart";
import { ANALYTICS_PRESETS } from "@/utils/opsAnalytics/range";

function money(n) {
  return `USD ${Number(n || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function num(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function formatTick(iso, granularity) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (granularity === "month") {
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Delta({ pct }) {
  if (pct == null) {
    return <p className="ops-card-note">No comparable prior period</p>;
  }
  const up = pct >= 0;
  return (
    <p className={`ops-card-note ${up ? "text-emerald-700" : "text-red-700"}`}>
      {up ? "+" : ""}
      {pct}% vs previous period
    </p>
  );
}

function Kpi({ label, value, pct, hint }) {
  return (
    <article className="ops-card">
      <p className="ops-card-label">{label}</p>
      <p className="ops-card-value">{value}</p>
      <Delta pct={pct} />
      {hint ? <p className="ops-card-note">{hint}</p> : null}
    </article>
  );
}

function queryFromState(state) {
  const params = new URLSearchParams();
  params.set("preset", state.preset);
  params.set("granularity", state.granularity);
  if (state.preset === "custom") {
    if (state.from) params.set("from", state.from);
    if (state.to) params.set("to", state.to);
  }
  return params.toString();
}

export default function OpsAnalyticsPanel() {
  const [preset, setPreset] = useState("last_30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [granularity, setGranularity] = useState("day");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const qs = useMemo(
    () => queryFromState({ preset, from, to, granularity }),
    [preset, from, to, granularity],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ops/analytics?${qs}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    load();
  }, [load]);

  async function download(kind) {
    setBusy(kind);
    try {
      const path =
        kind === "pdf"
          ? `/api/ops/analytics/report?${qs}`
          : `/api/ops/analytics/export?kind=${kind}&${qs}`;
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        kind === "pdf"
          ? "isisel-analytics.pdf"
          : `isisel-analytics-${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed");
    } finally {
      setBusy("");
    }
  }

  const k = report?.kpis;
  const tickFormat = (iso) => formatTick(iso, report?.range?.granularity || granularity);

  return (
    <div className="space-y-6">
      <div className="ops-card flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            Date range (UTC)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ANALYTICS_PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  preset === item.id
                    ? "bg-[#0a0a0a] text-white"
                    : "border border-[#ececec] bg-white text-[#0a0a0a]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {preset === "custom" ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-lg border border-[#ececec] px-2 text-sm"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-lg border border-[#ececec] px-2 text-sm"
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {["day", "week", "month"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                granularity === g
                  ? "bg-[#1b5c57] text-white"
                  : "border border-[#ececec] bg-white"
              }`}
            >
              {g === "day" ? "Daily" : g === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || !report}
          onClick={() => download("pdf")}
          className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy === "pdf" ? "Preparing…" : "Generate PDF report"}
        </button>
        {["kpis", "users", "hosts", "properties", "reservations", "booking-value", "revenue"].map(
          (kind) => (
            <button
              key={kind}
              type="button"
              disabled={Boolean(busy) || !report}
              onClick={() => download(kind)}
              className="rounded-xl border border-[#ececec] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Export {kind} CSV
            </button>
          ),
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="px-1 py-10 text-sm text-[#6b6b6b]">Loading live records…</p>
      ) : !report ? (
        <p className="ops-card px-4 py-10 text-sm text-[#6b6b6b]">
          No analytics could be calculated for this range.
        </p>
      ) : (
        <>
          <p className="text-sm text-[#6b6b6b]">
            {report.range.label}
            {report.range.previousLabel ? ` · vs ${report.range.previousLabel}` : ""}
          </p>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
              Executive overview
            </h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              <Kpi label="Users" value={num(k.users.current)} pct={k.users.deltaPct} />
              <Kpi label="Hosts" value={num(k.hosts.current)} pct={k.hosts.deltaPct} />
              <Kpi label="Properties" value={num(k.properties.current)} pct={k.properties.deltaPct} />
              <Kpi
                label="Reservations"
                value={num(k.reservations.current)}
                pct={k.reservations.deltaPct}
                hint="Created by the end of this period"
              />
              <Kpi
                label="Booking value managed"
                value={money(k.grossBookingValue.current)}
                pct={k.grossBookingValue.deltaPct}
                hint="Pending + confirmed stay totals"
              />
              <Kpi
                label="Isisel commission recorded"
                value={money(k.isiselRevenue.current)}
                pct={k.isiselRevenue.deltaPct}
                hint="Not a payment-processor settlement"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
              Platform KPIs
            </h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              <Kpi label="Total users" value={num(k.users.current)} pct={k.users.deltaPct} />
              <Kpi label="Total hosts" value={num(k.hosts.current)} pct={k.hosts.deltaPct} />
              <Kpi label="Total properties" value={num(k.properties.current)} pct={k.properties.deltaPct} />
              <Kpi
                label="Total reservations"
                value={num(k.reservations.current)}
                pct={k.reservations.deltaPct}
              />
              <Kpi
                label="Confirmed this period"
                value={num(k.confirmedReservations.current)}
                pct={k.confirmedReservations.deltaPct}
              />
              <Kpi
                label="Cancelled this period"
                value={num(k.cancelledReservations.current)}
                pct={k.cancelledReservations.deltaPct}
              />
              <Kpi
                label="Commission waived"
                value={money(k.commissionWaived.current)}
                pct={k.commissionWaived.deltaPct}
              />
              <Kpi
                label="Site visitors"
                value={num(k.siteVisitors.current)}
                pct={k.siteVisitors.deltaPct}
                hint="Anonymous public traffic, not signed-in DAU"
              />
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <SmoothAreaChart
              label="User growth"
              subtitle={`${num(report.users.total)} total · ${num(report.users.newInPeriod)} new this period · cumulative stock`}
              series={report.users.series}
              tickFormat={tickFormat}
              emptyHint="No registrations in this range."
            />
            <SmoothAreaChart
              label="Host growth"
              subtitle={`${num(report.hosts.total)} verified · ${num(report.hosts.newInPeriod)} applications approved · ${num(report.hosts.hostsWithProperties)} with a listing`}
              series={report.hosts.series}
              tickFormat={tickFormat}
              emptyHint="No host approvals in this range."
            />
            <SmoothAreaChart
              label="Property growth"
              subtitle={`${num(report.properties.total)} total · ${report.properties.activeListings} live · ${report.properties.avgPerHost} per host · cumulative stock`}
              series={report.properties.series}
              tickFormat={tickFormat}
              emptyHint="No new properties in this range."
            />
            <SmoothAreaChart
              label="Reservations"
              subtitle={`${num(report.reservations.createdInPeriod)} this period · ${report.reservations.confirmationRate ?? "n/a"}% confirmed · ${report.reservations.avgPerDay}/day`}
              series={report.reservations.series}
              tickFormat={tickFormat}
              emptyHint="No reservations in this range."
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <GlowBarChart
              label="Reservation mix"
              subtitle="This period, by status"
              bars={[
                { label: "Pending", value: report.reservations.pending, tone: "amber" },
                { label: "Confirmed", value: report.reservations.confirmed, tone: "green" },
                { label: "Cancelled", value: report.reservations.cancelled, tone: "ink" },
                { label: "Completed", value: report.reservations.completed, tone: "teal" },
              ]}
            />
            <article className="ops-card">
              <p className="ops-chart-title">Booking value & commission</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6b6b6b]">
                {report.notes.bookingValue}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Managed through Isisel
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.liveValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Confirmed value
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.confirmedValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Gateway confirmed
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.gatewayValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Commission recorded
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.revenue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Commission waived
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.waived)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
                    Avg confirmed booking
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {money(report.economics.avgBookingValue)}
                  </dd>
                </div>
              </dl>
            </article>
          </section>

          <SmoothAreaChart
            label="Isisel commission recorded"
            subtitle="Confirmed reservations only"
            series={report.economics.seriesRevenue}
            tickFormat={tickFormat}
            emptyHint="No recorded commission in this range."
          />

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="ops-card">
              <p className="ops-chart-title">Founding 100</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {report.founding.claimed} / {report.founding.limit}
              </p>
              <p className="text-sm text-[#6b6b6b]">
                {report.founding.remaining} spots remaining
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-[#6b6b6b]">Active</dt>
                  <dd className="font-semibold">{num(report.founding.active)}</dd>
                </div>
                <div>
                  <dt className="text-[#6b6b6b]">Expired</dt>
                  <dd className="font-semibold">{num(report.founding.expired)}</dd>
                </div>
                <div>
                  <dt className="text-[#6b6b6b]">Bookings generated</dt>
                  <dd className="font-semibold">{num(report.founding.bookingsGenerated)}</dd>
                </div>
                <div>
                  <dt className="text-[#6b6b6b]">Value generated</dt>
                  <dd className="font-semibold">{money(report.founding.bookingValue)}</dd>
                </div>
                <div>
                  <dt className="text-[#6b6b6b]">Commission waived</dt>
                  <dd className="font-semibold">{money(report.founding.commissionWaived)}</dd>
                </div>
              </dl>
            </article>
            <GlowBarChart
              label="Platform funnel"
              subtitle={`${report.funnel.conversions.userToHost ?? "n/a"}% users→hosts · ${report.funnel.conversions.hostToListed ?? "n/a"}% hosts listed · ${report.funnel.conversions.listedToBookedProperty ?? "n/a"}% properties booked`}
              bars={[
                { label: "Users", value: report.funnel.users, tone: "ink" },
                { label: "Hosts", value: report.funnel.hosts, tone: "teal" },
                { label: "With listings", value: report.funnel.hostsWithProperties, tone: "green" },
                { label: "Booked listings", value: report.funnel.propertiesWithReservations, tone: "amber" },
              ]}
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <PlaceList title="Properties by country" rows={report.geo.properties.countries} />
            <PlaceList title="Reservations by country" rows={report.geo.reservations.countries} />
            <PlaceList title="Hosts by country" rows={report.geo.hosts.countries} />
            <PlaceList title="Top cities by properties" rows={report.geo.properties.cities} />
            <PlaceList title="Top cities by reservations" rows={report.geo.reservations.cities} />
          </section>

          <article className="ops-card">
            <p className="ops-chart-title">What these numbers are — and are not</p>
            <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#6b6b6b]">
              <li>{report.notes.activeUsers}</li>
              <li>{report.notes.completedStays}</li>
              <li>{report.notes.hostGrowth}</li>
              <li>{report.notes.bookingValue}</li>
              <li>{report.notes.currencies}</li>
              <li>{report.notes.userGeo}</li>
              <li>{report.notes.trainingStays}</li>
            </ul>
          </article>
        </>
      )}
    </div>
  );
}

function PlaceList({ title, rows }) {
  return (
    <article className="ops-card">
      <p className="ops-chart-title">{title}</p>
      {rows?.length ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.name} className="flex justify-between gap-3">
              <span className="truncate text-[#0a0a0a]">{row.name}</span>
              <span className="tabular-nums text-[#6b6b6b]">{num(row.value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#6b6b6b]">No location fields on these records.</p>
      )}
    </article>
  );
}
