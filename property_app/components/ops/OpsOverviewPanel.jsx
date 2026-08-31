"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const MAX_LOOKBACK_MINUTES = 60;
const SLIDER_MARKS = [0, 5, 15, 30, 45, 60];
const TEAL = "#1B5C57";

/**
 * Relative age for ops queue rows. Uses whole minutes for a calm, scannable label.
 */
function formatRelativeSubmitted(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function locationLabel(location) {
  if (!location) return "No location";
  return (
    [location.city, location.state, location.country].filter(Boolean).join(", ") ||
    "No location"
  );
}

function hostLabel(listing) {
  return (
    listing.ownerUser?.username ||
    listing.ownerUser?.email ||
    listing.seller_info?.name ||
    listing.seller_info?.email ||
    "—"
  );
}

function statusBadgeClass(status) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Ops home Overview metrics + Recent listings lookback (0–60 min, FIFO).
 *
 * Data is loaded once for the full 60-minute window; the slider filters client-side.
 * 0 minutes = window off (empty list) — not “live instant”.
 */
export default function OpsOverviewPanel() {
  const [lookbackMinutes, setLookbackMinutes] = useState(30);
  const [listings, setListings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ops/overview?sinceMinutes=${MAX_LOOKBACK_MINUTES}&nc=${Date.now()}`,
          {
            cache: "no-store",
            credentials: "include",
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          },
        );
        if (!res.ok) {
          throw new Error((await res.text()) || "Failed to load overview");
        }
        const data = await res.json();
        if (cancelled) return;
        setListings(Array.isArray(data.listings) ? data.listings : []);
        setMetrics(data.metrics || null);
        setFetchedAt(Date.now());
      } catch (err) {
        console.error("Ops overview fetch failed:", err);
        if (!cancelled) {
          setError("Could not load overview data.");
          setListings([]);
          setMetrics(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * FIFO within the selected window: keep rows whose submittedAt falls inside
   * [now − lookback, now]. API already sorted oldest→newest; filter preserves order.
   * lookbackMinutes === 0 → empty (window disabled).
   */
  const visibleListings = useMemo(() => {
    if (lookbackMinutes <= 0) return [];
    const cutoffMs =
      (fetchedAt || Date.now()) - lookbackMinutes * 60 * 1000;
    return listings.filter((row) => {
      const t = new Date(row.submittedAt).getTime();
      return Number.isFinite(t) && t >= cutoffMs;
    });
  }, [listings, lookbackMinutes, fetchedAt]);

  const metricCards = [
    {
      label: "Active listings",
      value: metrics?.activeListings,
    },
    {
      label: "Pending reviews",
      value: metrics?.pendingReviews,
    },
    {
      label: "Transactions (30d)",
      value: metrics?.transactions30d,
    },
  ];

  return (
    <>
      <section className="mt-10" aria-labelledby="ops-metrics-heading">
        <h2
          id="ops-metrics-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
        >
          Overview
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {metricCards.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-6"
            >
              <p className="text-xs font-medium text-[var(--kama-ink-muted)]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--kama-ink)]">
                {loading && metrics == null
                  ? "…"
                  : value == null
                    ? "—"
                    : value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="ops-recent-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="ops-recent-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
            >
              Recent listings
            </h2>
            <p className="mt-1.5 text-sm text-[var(--kama-ink-muted)]">
              Oldest first (FIFO) by submit time — processing queue for the
              selected lookback.
            </p>
          </div>
          <Link
            href="/ops/listings"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#1B5C57]/30 bg-[#1B5C57]/5 px-3.5 py-2 text-sm font-semibold text-[#1B5C57] transition hover:bg-[#1B5C57]/10"
          >
            Open listings
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="ops-recent-lookback"
              className="text-sm font-medium text-[var(--kama-ink)]"
            >
              Last{" "}
              <span className="tabular-nums text-[#1B5C57]">
                {lookbackMinutes}
              </span>{" "}
              {lookbackMinutes === 1 ? "minute" : "minutes"}
            </label>
            <span className="text-xs text-[var(--kama-ink-muted)]">
              {lookbackMinutes === 0
                ? "Window off — no listings shown"
                : `${visibleListings.length} in window`}
            </span>
          </div>

          <input
            id="ops-recent-lookback"
            type="range"
            min={0}
            max={MAX_LOOKBACK_MINUTES}
            step={1}
            value={lookbackMinutes}
            onChange={(e) => setLookbackMinutes(Number(e.target.value))}
            className="mt-3 w-full accent-[#1B5C57]"
            style={{ accentColor: TEAL }}
            aria-valuemin={0}
            aria-valuemax={MAX_LOOKBACK_MINUTES}
            aria-valuenow={lookbackMinutes}
            aria-valuetext={
              lookbackMinutes === 0
                ? "Window off"
                : `Last ${lookbackMinutes} minutes`
            }
          />

          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--kama-ink-muted)]">
            {SLIDER_MARKS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLookbackMinutes(m)}
                className={`hover:text-[#1B5C57] ${
                  lookbackMinutes === m
                    ? "font-semibold text-[#1B5C57]"
                    : ""
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)]">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm text-[var(--kama-ink-muted)]">
              <span
                className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B5C57] border-t-transparent"
                aria-hidden
              />
              Loading recent listings…
            </div>
          ) : lookbackMinutes === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[var(--kama-ink-muted)]">
              Lookback is off (0 min). Move the slider to see listings submitted
              in that window.
            </p>
          ) : visibleListings.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[var(--kama-ink-muted)]">
              No listings submitted in the last {lookbackMinutes}{" "}
              {lookbackMinutes === 1 ? "minute" : "minutes"}.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--kama-border)]">
              {visibleListings.map((listing) => {
                const id = listing._id;
                return (
                  <li
                    key={id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--kama-ink)]">
                          {listing.name}
                        </p>
                        {listing.status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                              listing.status,
                            )}`}
                          >
                            {listing.status}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-[var(--kama-ink-muted)]">
                        {locationLabel(listing.location)}
                        {listing.type ? (
                          <>
                            {" · "}
                            <span className="capitalize">{listing.type}</span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
                        Host: {hostLabel(listing)}
                        {" · "}
                        {formatRelativeSubmitted(listing.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/properties/${id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#1B5C57] transition hover:bg-[#1B5C57]/5"
                      >
                        View
                      </Link>
                      <Link
                        href="/ops/listings"
                        className="rounded-lg bg-[#1B5C57] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#164e4a]"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
