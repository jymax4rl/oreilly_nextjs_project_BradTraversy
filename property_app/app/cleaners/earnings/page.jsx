"use client";

import { useEffect, useState } from "react";

export default function CleanerEarningsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/cleaners/earnings")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Earnings</h1>
      <p className="text-sm text-[var(--kama-ink-muted)]">
        Payment processing is not live yet. These totals are for tracking agreed prices.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <p className="text-xs uppercase text-[var(--kama-ink-muted)]">This month</p>
          <p className="mt-1 text-2xl font-semibold">
            {data?.currency || "GMD"} {Number(data?.thisMonth || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
          <p className="text-xs uppercase text-[var(--kama-ink-muted)]">Completed</p>
          <p className="mt-1 text-2xl font-semibold">{data?.completed || 0}</p>
        </div>
      </div>
    </div>
  );
}
