"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Link2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import HostPageHeader from "@/components/host/HostPageHeader";
import HostCreatorCodeModal from "@/components/host/creators/HostCreatorCodeModal";
import "../home/host-home.css";

const RING_R = 27;
const RING_C = 2 * Math.PI * RING_R;
const RING_GAP = 11;
const RING_ARC = RING_C - RING_GAP;

function money(n, locale) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function pct(rate) {
  return `${Math.round((Number(rate) || 0) * 1000) / 10}%`;
}

function shortDate(ymd, locale) {
  if (!ymd) return "—";
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function PulseRing({ label, value, color, delay = 0 }) {
  const count = Number(value) || 0;
  return (
    <li className="flex items-center gap-3 rounded-xl py-1 pr-2">
      <span className="relative inline-flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
          <circle
            className="host-pulse-ring"
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray={`${RING_ARC} ${RING_GAP}`}
            style={{ animationDelay: `${delay}ms`, "--ring-arc": RING_ARC }}
          />
        </svg>
        <span
          className="host-pulse-count text-[1.35rem] font-semibold tabular-nums tracking-tight"
          style={{ color, animationDelay: `${delay + 80}ms` }}
        >
          {count}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--kama-ink)]">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        {label}
      </span>
    </li>
  );
}

const emptyPartnerForm = {
  name: "",
  email: "",
  platform: "",
  profileUrl: "",
};

export default function HostCreatorsView({ initial }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [summary, setSummary] = useState(initial?.summary || {});
  const [creators, setCreators] = useState(initial?.creators || []);
  const [properties] = useState(initial?.properties || []);
  const [selectedId, setSelectedId] = useState(creators[0]?.id || null);
  const [partnerForm, setPartnerForm] = useState(emptyPartnerForm);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [codeModal, setCodeModal] = useState({
    open: false,
    mode: "create",
    code: null,
  });

  const selected = useMemo(
    () => creators.find((c) => c.id === selectedId) || creators[0] || null,
    [creators, selectedId],
  );

  async function refreshProgram() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/host/creators");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to refresh");
      setCreators(data.creators || []);
      setSummary(data.summary || {});
      if (selectedId && !(data.creators || []).some((c) => c.id === selectedId)) {
        setSelectedId(data.creators?.[0]?.id || null);
      }
      router.refresh();
    } catch (err) {
      setError(err.message || t("hostConsole.creators.failed"));
    } finally {
      setRefreshing(false);
    }
  }

  async function addPartner(e) {
    e.preventDefault();
    setBusy("partner");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/host/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.creators.failed"));
      setPartnerForm(emptyPartnerForm);
      setNotice(t("hostConsole.creators.partnerAdded"));
      await refreshProgram();
      if (data.id) setSelectedId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function toggleCode(code) {
    const next = code.status === "active" ? "paused" : "active";
    setBusy(`code-${code.id}`);
    setError("");
    try {
      const res = await fetch(`/api/host/creators/codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.creators.failed"));
      await refreshProgram();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function sharePortal(rotate = false) {
    if (!selected?.id) return;
    setBusy("portal");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/host/creators/${selected.id}/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.creators.failed"));
      const absolute =
        typeof window !== "undefined"
          ? `${window.location.origin}${data.portalPath}`
          : data.portalPath;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absolute);
      }
      setNotice(t("hostConsole.creators.portalCopied"));
      await refreshProgram();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function openAssignModal() {
    setCodeModal({ open: true, mode: "create", code: null });
  }

  function openEditModal(code) {
    setCodeModal({ open: true, mode: "edit", code });
  }

  async function onCodeModalSaved() {
    const wasEdit = codeModal.mode === "edit";
    setNotice(
      wasEdit
        ? t("hostConsole.creators.codeUpdated")
        : t("hostConsole.creators.codeAdded"),
    );
    setCodeModal({ open: false, mode: "create", code: null });
    await refreshProgram();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <HostPageHeader
          titleKey="hostConsole.creators.title"
          blurbKey="hostConsole.creators.blurb"
        />
        <button
          type="button"
          onClick={refreshProgram}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink-muted)] transition hover:border-[var(--kama-border-strong)] hover:text-[var(--kama-ink)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing
            ? t("hostConsole.homeRefreshing")
            : t("hostConsole.homeRefresh")}
        </button>
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[var(--kama-ink-muted)]">
        {t("hostConsole.creators.fundingNote")}
      </p>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-accent-soft)] px-3 py-2 text-sm text-[var(--kama-accent)]">
          {notice}
        </p>
      ) : null}

      <section className="mb-8">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <PulseRing
            label={t("hostConsole.creators.pulseCreators")}
            value={summary.creators}
            color="var(--kama-accent)"
            delay={0}
          />
          <PulseRing
            label={t("hostConsole.creators.pulseCodes")}
            value={summary.activeCodes}
            color="#2a7a74"
            delay={80}
          />
          <PulseRing
            label={t("hostConsole.creators.pulseReservations")}
            value={summary.reservations}
            color="#1b5c57"
            delay={160}
          />
          <PulseRing
            label={t("hostConsole.creators.pulseCompleted")}
            value={summary.completedReservations}
            color="#0f766e"
            delay={240}
          />
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.bookingValue")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
              {money(summary.bookingValue, lang)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.commissionPending")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
              {money(summary.commissionPending, lang)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.commissionCompleted")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
              {money(summary.commissionCompleted, lang)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.partners")}
            </h2>
            <span className="text-xs text-[var(--kama-ink-muted)]">
              {creators.length}
            </span>
          </div>

          {creators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--kama-border-strong)] bg-[var(--kama-field)] px-5 py-8 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-[var(--kama-accent)]" />
              <p className="mt-3 text-sm font-medium text-[var(--kama-ink)]">
                {t("hostConsole.creators.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
                {t("hostConsole.creators.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {creators.map((c) => {
                const active = selected?.id === c.id;
                const rates = [
                  ...new Set(
                    (c.codes || []).map((code) => pct(code.commissionRate)),
                  ),
                ];
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[var(--kama-accent)] bg-[var(--kama-accent-soft)]"
                          : "border-[var(--kama-border)] bg-[var(--kama-surface)] hover:border-[var(--kama-border-strong)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--kama-ink)]">
                            {c.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--kama-ink-muted)]">
                            {c.platform || t("hostConsole.creators.platformOther")}
                            {c.codes.length
                              ? ` · ${c.codes.length} ${t("hostConsole.creators.codesLabel")}`
                              : ""}
                            {rates.length
                              ? ` · ${t("hostConsole.creators.commissionShort")} ${rates.join(", ")}`
                              : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                            {c.reservations}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-[var(--kama-ink-muted)]">
                            {t("hostConsole.creators.reservations")}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={addPartner}
            className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
          >
            <p className="mb-3 text-sm font-semibold text-[var(--kama-ink)]">
              {t("hostConsole.creators.addPartner")}
            </p>
            <div className="space-y-3">
              <input
                required
                value={partnerForm.name}
                onChange={(e) =>
                  setPartnerForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder={t("hostConsole.creators.namePh")}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 text-sm outline-none focus:border-[var(--kama-accent)]"
              />
              <input
                type="email"
                value={partnerForm.email}
                onChange={(e) =>
                  setPartnerForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder={t("hostConsole.creators.emailPh")}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 text-sm outline-none focus:border-[var(--kama-accent)]"
              />
              <select
                required
                value={partnerForm.platform}
                onChange={(e) =>
                  setPartnerForm((f) => ({ ...f, platform: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 text-sm outline-none focus:border-[var(--kama-accent)]"
              >
                <option value="" disabled>
                  {t("hostConsole.creators.platformRequired")}
                </option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="multiple">
                  {t("hostConsole.creators.platformMultiple")}
                </option>
                <option value="other">
                  {t("hostConsole.creators.platformOther")}
                </option>
              </select>
              <input
                required
                value={partnerForm.profileUrl}
                onChange={(e) =>
                  setPartnerForm((f) => ({ ...f, profileUrl: e.target.value }))
                }
                placeholder={t("hostConsole.creators.profilePh")}
                className="w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2 text-sm outline-none focus:border-[var(--kama-accent)]"
              />
              <button
                type="submit"
                disabled={busy === "partner"}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {busy === "partner"
                  ? t("hostConsole.creators.saving")
                  : t("hostConsole.creators.addPartner")}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          {selected ? (
            <>
              <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-[var(--kama-ink)]">
                      {selected.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-[var(--kama-ink-muted)]">
                      {selected.email || t("hostConsole.creators.noEmail")}
                      {selected.platform ? ` · ${selected.platform}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      selected.status === "active"
                        ? "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]"
                        : "bg-[var(--kama-field)] text-[var(--kama-ink-muted)]"
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === "portal"}
                    onClick={() => sharePortal(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--kama-border)] px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink)] transition hover:border-[var(--kama-border-strong)]"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {t("hostConsole.creators.sharePortal")}
                  </button>
                  {selected.portalToken ? (
                    <button
                      type="button"
                      disabled={busy === "portal"}
                      onClick={() => sharePortal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--kama-border)] px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink-muted)]"
                    >
                      {t("hostConsole.creators.rotatePortal")}
                    </button>
                  ) : null}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                      {t("hostConsole.creators.reservations")}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
                      {selected.reservations}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                      {t("hostConsole.creators.completed")}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
                      {selected.completedReservations}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                      {t("hostConsole.creators.pending")}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
                      {selected.pendingReservations}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                      {t("hostConsole.creators.earned")}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--kama-ink)]">
                      {money(selected.commissionEarned, lang)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--kama-ink)]">
                    {t("hostConsole.creators.codesHeading")}
                  </h3>
                  <button
                    type="button"
                    disabled={properties.length === 0}
                    onClick={openAssignModal}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("hostConsole.creators.assignCode")}
                  </button>
                </div>
                {selected.codes.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--kama-ink-muted)]">
                    {t("hostConsole.creators.noCodes")}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {selected.codes.map((code) => (
                      <li
                        key={code.id}
                        className="rounded-xl border border-[var(--kama-border)] px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold tracking-wide text-[var(--kama-ink)]">
                              {code.code}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                              {code.propertyName} · {code.status}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(code)}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--kama-border)] px-2.5 py-1 text-xs font-semibold text-[var(--kama-ink)] transition hover:border-[var(--kama-border-strong)]"
                            >
                              <Pencil className="h-3 w-3" />
                              {t("hostConsole.creators.editCode")}
                            </button>
                            <button
                              type="button"
                              disabled={busy === `code-${code.id}`}
                              onClick={() => toggleCode(code)}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--kama-border)] px-2.5 py-1 text-xs font-semibold text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
                            >
                              {code.status === "active" ? (
                                <>
                                  <Pause className="h-3 w-3" />
                                  {t("hostConsole.creators.pause")}
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" />
                                  {t("hostConsole.creators.resume")}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="rounded-lg bg-[var(--kama-field)] px-2.5 py-2">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                              {t("hostConsole.creators.commissionLabel")}
                            </dt>
                            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                              {pct(code.commissionRate)}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-[var(--kama-field)] px-2.5 py-2">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                              {t("hostConsole.creators.guestDiscountLabel")}
                            </dt>
                            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                              −
                              {pct(
                                code.guestDiscountRate != null
                                  ? code.guestDiscountRate
                                  : 0.1,
                              )}
                            </dd>
                          </div>
                          <div className="col-span-2 rounded-lg bg-[var(--kama-field)] px-2.5 py-2 sm:col-span-1">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                              {t("hostConsole.creators.propertyLabel")}
                            </dt>
                            <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--kama-ink)]">
                              {code.propertyName}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--kama-ink)]">
                  {t("hostConsole.creators.recentStays")}
                </h3>
                {selected.recentBookings?.length ? (
                  <ul className="mt-3 divide-y divide-[var(--kama-border)]">
                    {selected.recentBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--kama-ink)]">
                            {b.guestName || t("hostConsole.guest")} ·{" "}
                            {b.propertyName}
                          </p>
                          <p className="text-xs text-[var(--kama-ink-muted)]">
                            {shortDate(b.checkIn, lang)} –{" "}
                            {shortDate(b.checkOut, lang)}
                            {b.promoCode ? ` · ${b.promoCode}` : ""} · {b.status}
                            {b.commissionStatus
                              ? ` · ${b.commissionStatus}`
                              : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-[var(--kama-ink)]">
                          {money(b.commission, lang)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
                    {t("hostConsole.creators.noStays")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--kama-border-strong)] bg-[var(--kama-field)] px-5 py-12 text-center text-sm text-[var(--kama-ink-muted)]">
              {t("hostConsole.creators.selectPartner")}
            </div>
          )}
        </section>
      </div>

      <HostCreatorCodeModal
        open={codeModal.open}
        mode={codeModal.mode}
        partner={selected}
        code={codeModal.code}
        properties={properties}
        onClose={() =>
          setCodeModal({ open: false, mode: "create", code: null })
        }
        onSaved={onCodeModalSaved}
      />
    </div>
  );
}
