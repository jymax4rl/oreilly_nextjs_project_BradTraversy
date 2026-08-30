"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  calculateBookingBase,
  getPrimaryDisplayRate,
  hasAnyRate,
  normalizeRates,
} from "@/utils/propertyRates";

const FIELDS = [
  { key: "nightly", label: "Nightly", hint: "Per night stays" },
  { key: "weekly", label: "Weekly", hint: "Week-long stays" },
  { key: "monthly", label: "Monthly", hint: "28+ night stays" },
];

export default function HostRatesForm({ propertyId, propertyName }) {
  const [rates, setRates] = useState({
    nightly: "",
    weekly: "",
    monthly: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/rates`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rates");
      const r = data.rates || {};
      setRates({
        nightly: r.nightly != null ? String(r.nightly) : "",
        weekly: r.weekly != null ? String(r.weekly) : "",
        monthly: r.monthly != null ? String(r.monthly) : "",
      });
    } catch (e) {
      setError(e.message || "Could not load rates");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const normalized = useMemo(
    () =>
      normalizeRates({
        nightly: rates.nightly,
        weekly: rates.weekly,
        monthly: rates.monthly,
      }),
    [rates],
  );

  const primary = useMemo(() => getPrimaryDisplayRate(normalized), [normalized]);

  const exampleStay = useMemo(() => {
    if (!hasAnyRate(normalized)) return null;
    return calculateBookingBase(normalized, 3);
  }, [normalized]);

  const setField = (key, value) => {
    setRates((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/rates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightly: rates.nightly === "" ? null : rates.nightly,
          weekly: rates.weekly === "" ? null : rates.weekly,
          monthly: rates.monthly === "" ? null : rates.monthly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const r = data.rates || {};
      setRates({
        nightly: r.nightly != null ? String(r.nightly) : "",
        weekly: r.weekly != null ? String(r.weekly) : "",
        monthly: r.monthly != null ? String(r.monthly) : "",
      });
      setSuccess("Rates saved to your listing");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <p className="text-sm text-slate-600">
        Set prices in <strong>USD</strong> for{" "}
        <span className="font-medium text-slate-900">{propertyName}</span>.
        Leave a field empty if you do not offer that period. At least one rate is
        required.
      </p>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="relative">
            <label
              htmlFor={`rate-${key}`}
              className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              <span>{label}</span>
              <span className="font-normal normal-case text-slate-400">{hint}</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                $
              </span>
              <input
                id={`rate-${key}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Not offered"
                value={rates[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-lg font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        ))}
      </div>

      {primary && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-900">
          <p className="font-semibold">Listing preview</p>
          <p className="mt-1 tabular-nums">
            From ${primary.amount.toLocaleString()}
            {primary.suffix}
          </p>
          {exampleStay && (
            <p className="mt-1 text-indigo-700/90">
              Example 3-night stay: ${exampleStay.base.toLocaleString()} (
              {exampleStay.label})
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {saving ? "Saving…" : "Save rates"}
      </button>
    </div>
  );
}
