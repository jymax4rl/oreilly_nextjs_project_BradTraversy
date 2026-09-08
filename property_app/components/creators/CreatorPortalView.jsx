"use client";

import { useMemo } from "react";

function money(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function pct(rate) {
  return `${Math.round((Number(rate) || 0) * 1000) / 10}%`;
}

function shortDate(ymd) {
  if (!ymd) return "—";
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_LABEL = {
  pending_stay: "Awaiting checkout",
  accrued: "Accrued",
  on_hold: "On hold",
  approved: "Approved",
  payable: "Payable",
  paid: "Paid",
  reversed: "Reversed",
};

export default function CreatorPortalView({ data }) {
  const { creator, summary, codes, bookings } = data;
  const activeCode = useMemo(
    () => codes.find((c) => c.status === "active") || codes[0],
    [codes],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f5f3_0%,_#f7f6f2_45%,_#f3efe6_100%)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--kama-accent)]">
          Isisel · Creator portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--kama-ink)]">
          {creator.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
          Performance earnings from attributed stays — paid after checkout,
          separate from Isisel platform fees.
        </p>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Bookings", value: summary.reservations },
            { label: "Accrued", value: money(summary.accrued) },
            { label: "Paid", value: money(summary.paid) },
            { label: "Open", value: money(summary.pending) },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--kama-border)] bg-white/80 px-4 py-4 shadow-[0_12px_32px_-24px_rgba(27,92,87,0.45)] backdrop-blur"
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

        {activeCode ? (
          <section className="mt-6 rounded-2xl border border-[var(--kama-border)] bg-white/90 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Active promo code
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wide text-[var(--kama-accent)]">
              {activeCode.code}
            </p>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              {pct(activeCode.commissionRate)} of accommodation · {activeCode.status}
              {codes.length > 1 ? ` · ${codes.length} codes total` : ""}
            </p>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
            Recent attributed stays
          </h2>
          {bookings?.length ? (
            <ul className="mt-3 divide-y divide-[var(--kama-border)] overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-white/90">
              {bookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--kama-ink)]">
                      {b.propertyName || "Stay"}
                      {b.promoCode ? ` · ${b.promoCode}` : ""}
                    </p>
                    <p className="text-xs text-[var(--kama-ink-muted)]">
                      {shortDate(b.checkIn)} – {shortDate(b.checkOut)} ·{" "}
                      {STATUS_LABEL[b.status] || b.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                    {money(b.amount, b.currency)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-[var(--kama-border-strong)] bg-white/60 px-4 py-8 text-center text-sm text-[var(--kama-ink-muted)]">
              No attributed reservations yet. Share your promo code with your
              audience — earnings appear here after guests book.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
