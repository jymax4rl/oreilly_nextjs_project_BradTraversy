"use client";

import { useEffect, useState } from "react";

/**
 * Host IBAN capture for platform-managed settlement.
 * Guests pay Isisel (GeniusPay / Creem); payouts to this IBAN are handled by ops / future splits.
 */
export default function HostPayoutForm() {
  const [iban, setIban] = useState("");
  const [accountName, setAccountName] = useState("");
  const [masked, setMasked] = useState(null);
  const [savedName, setSavedName] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | saving | saved | error
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/user/host-payout");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Could not load payout profile");
          return;
        }
        setMasked(data.payout?.ibanMasked || null);
        setSavedName(data.payout?.accountName || null);
        setAccountName(data.payout?.accountName || "");
        setStatus("idle");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Could not load payout profile");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/user/host-payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban, accountName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not save IBAN");
        return;
      }
      setMasked(data.payout?.ibanMasked || null);
      setSavedName(data.payout?.accountName || null);
      setIban("");
      setStatus("saved");
    } catch {
      setStatus("error");
      setError("Could not save IBAN");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-4">
      <p className="text-sm font-medium text-[var(--kama-ink)]">
        Payout account (IBAN)
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--kama-ink-muted)]">
        Guests pay Isisel by card. Add your IBAN so we can settle your host share
        automatically when transfers are enabled for your corridor.
      </p>

      {masked ? (
        <p className="mt-3 text-sm text-[var(--kama-ink)]">
          On file: <span className="font-mono">{masked}</span>
          {savedName ? (
            <span className="text-[var(--kama-ink-muted)]"> · {savedName}</span>
          ) : null}
        </p>
      ) : null}

      <form onSubmit={onSave} className="mt-3 space-y-3">
        <label className="block text-xs font-medium text-[var(--kama-ink-muted)]">
          Account holder name
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 text-sm text-[var(--kama-ink)]"
            autoComplete="name"
            required
          />
        </label>
        <label className="block text-xs font-medium text-[var(--kama-ink-muted)]">
          IBAN
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder={masked ? "Enter a new IBAN to replace" : "FR76…"}
            className="mt-1 w-full rounded-lg border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 font-mono text-sm text-[var(--kama-ink)]"
            autoComplete="off"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="text-sm text-emerald-700">Payout details saved.</p>
        ) : null}
        <button
          type="submit"
          disabled={status === "saving" || status === "loading"}
          className="rounded-full bg-[var(--kama-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : masked ? "Update IBAN" : "Save IBAN"}
        </button>
      </form>
    </div>
  );
}
