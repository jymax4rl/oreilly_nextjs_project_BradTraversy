"use client";

import { useState } from "react";

export default function OpsCleanerRowActions({ userId, status }) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);

  const setStatus = async (cleanerStatus) => {
    setBusy(true);
    const res = await fetch(`/api/ops/cleaners/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanerStatus }),
    });
    if (res.ok) setCurrent(cleanerStatus);
    setBusy(false);
  };

  return (
    <span className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-[#6b6b6b]">{current}</span>
      {current === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setStatus("suspended")}
          className="text-xs text-rose-700"
        >
          Suspend
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => setStatus("active")}
          className="text-xs text-emerald-700"
        >
          Reinstate
        </button>
      )}
    </span>
  );
}
