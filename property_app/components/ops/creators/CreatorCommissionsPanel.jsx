"use client";

import { useCallback, useEffect, useState } from "react";

const STATUS_OPTS = [
  "",
  "pending_stay",
  "accrued",
  "on_hold",
  "approved",
  "payable",
  "paid",
  "reversed",
];

function money(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function CreatorCommissionsPanel() {
  const [status, setStatus] = useState("accrued");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/ops/creators/commissions?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("load_failed");
    const json = await res.json();
    setRows(json.commissions || []);
    setSummary(json.summary || null);
  }, [status]);

  useEffect(() => {
    load().catch(() => setError("Could not load commissions."));
  }, [load]);

  async function patch(body) {
    setBusy(body.id || body.action || "save");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/ops/creators/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "save_failed");
      if (body.action === "finalize") {
        setNotice(
          `Finalized ${json.accrued || 0} accrued · scanned ${json.scanned || 0}`,
        );
      }
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
            Creator commission ledger
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--kama-ink-muted)]">
            Separate from platform fees. Accrue after checkout, then approve →
            payable → paid.
          </p>
        </div>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ action: "finalize" })}
          className="rounded-full bg-[var(--kama-accent)] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {busy === "finalize" ? "Running…" : "Run post-stay finalize"}
        </button>
      </div>

      {summary ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Accrued", summary.accrued],
            ["Payable", summary.payable],
            ["Paid", summary.paid],
            ["Pending stay", summary.pendingStay],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
                {label}
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                {money(value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_OPTS.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === s
                ? "bg-[var(--kama-accent)] text-white"
                : "bg-[var(--kama-field)] text-[var(--kama-ink-muted)]"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-3 text-sm text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="mb-3 text-sm text-[var(--kama-accent)]">{notice}</p>
      ) : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--kama-ink)]">
                  {row.creatorPartnerName || "Creator"} · {row.promoCode}
                </p>
                <p className="text-xs text-[var(--kama-ink-muted)]">
                  {row.propertyName} · {row.checkIn} → {row.checkOut} ·{" "}
                  {row.status}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {money(row.amount, row.currency)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {row.status === "accrued" ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    patch({ id: row.id, status: "approved", note: "ops approve" })
                  }
                  className="rounded-lg border border-[var(--kama-border)] px-2.5 py-1 text-xs font-semibold"
                >
                  Approve
                </button>
              ) : null}
              {row.status === "approved" ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => patch({ id: row.id, status: "payable" })}
                  className="rounded-lg border border-[var(--kama-border)] px-2.5 py-1 text-xs font-semibold"
                >
                  Mark payable
                </button>
              ) : null}
              {row.status === "payable" ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => {
                    const ref = window.prompt("Payout reference (optional)") || "";
                    patch({
                      id: row.id,
                      status: "paid",
                      payoutReference: ref,
                      note: "ops paid",
                    });
                  }}
                  className="rounded-lg border border-[var(--kama-border)] px-2.5 py-1 text-xs font-semibold"
                >
                  Mark paid
                </button>
              ) : null}
              {["accrued", "approved", "payable"].includes(row.status) ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    patch({
                      id: row.id,
                      status: "on_hold",
                      note: "ops hold",
                    })
                  }
                  className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800"
                >
                  Hold
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-[var(--kama-border-strong)] px-4 py-8 text-center text-sm text-[var(--kama-ink-muted)]">
            No commissions in this filter.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
