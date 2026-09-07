"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  calculateBookingBase,
  getPrimaryDisplayRate,
  hasAnyRate,
  normalizeRates,
} from "@/utils/propertyRates";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostRatesForm({ propertyId, propertyName }) {
  const { t } = useLanguage();
  const FIELDS = [
    { key: "nightly", labelKey: "hostConsole.rateForm.nightly", hintKey: "hostConsole.rateForm.nightlyHint" },
    { key: "weekly", labelKey: "hostConsole.rateForm.weekly", hintKey: "hostConsole.rateForm.weeklyHint" },
    { key: "monthly", labelKey: "hostConsole.rateForm.monthly", hintKey: "hostConsole.rateForm.monthlyHint" },
  ];
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
      if (!res.ok) throw new Error(data.error || t("hostConsole.rateForm.loadFailed"));
      const r = data.rates || {};
      setRates({
        nightly: r.nightly != null ? String(r.nightly) : "",
        weekly: r.weekly != null ? String(r.weekly) : "",
        monthly: r.monthly != null ? String(r.monthly) : "",
      });
    } catch (e) {
      setError(e.message || t("hostConsole.rateForm.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  }, [propertyId, t]);

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
      if (!res.ok) throw new Error(data.error || t("hostConsole.rateForm.saveFailed"));

      const r = data.rates || {};
      setRates({
        nightly: r.nightly != null ? String(r.nightly) : "",
        weekly: r.weekly != null ? String(r.weekly) : "",
        monthly: r.monthly != null ? String(r.monthly) : "",
      });
      setSuccess(t("hostConsole.rateForm.saved"));
    } catch (e) {
      setError(e.message || t("hostConsole.rateForm.saveFailed"));
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
        {t("hostConsole.rateForm.intro", { name: propertyName })}
      </p>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {FIELDS.map(({ key, labelKey, hintKey }) => (
          <div key={key} className="relative">
            <label
              htmlFor={`rate-${key}`}
              className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              <span>{t(labelKey)}</span>
              <span className="font-normal normal-case text-slate-400">{t(hintKey)}</span>
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
                placeholder={t("hostConsole.rateForm.notOffered")}
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
          <p className="font-semibold">{t("hostConsole.rateForm.preview")}</p>
          <p className="mt-1 tabular-nums">
            {t("hostConsole.rateForm.fromAmount", {
              amount: primary.amount.toLocaleString(),
              suffix: primary.suffix,
            })}
          </p>
          {exampleStay && (
            <p className="mt-1 text-indigo-700/90">
              {t("hostConsole.rateForm.exampleStay", {
                amount: exampleStay.base.toLocaleString(),
                label: exampleStay.label,
              })}
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
        {saving ? t("hostConsole.rateForm.saving") : t("hostConsole.rateForm.save")}
      </button>
    </div>
  );
}
