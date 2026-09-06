"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INVESTOR_STAGES,
  investorStageLabel,
} from "@/utils/investors/constants";
import "@/components/ops/acquisition/acquisition.css";

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

export default function InvestorLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [stage, setStage] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/ops/investors/leads?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("load_failed");
    const json = await res.json();
    setLeads(json.leads || []);
    setCounts(json.counts || {});
  }, [stage, q]);

  useEffect(() => {
    load().catch(() => setError("Could not load investor proposals."));
  }, [load]);

  const total = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + Number(n || 0), 0),
    [counts],
  );

  async function saveLead(patch) {
    if (!selected?.id) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/ops/investors/leads/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("save_failed");
      setSelected(json.lead);
      await load();
    } catch {
      setError("Could not update this proposal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-4 max-w-xl text-sm text-[var(--kama-ink-muted)]">
        Investor proposals from <code>/investors</code>. Each submit also emails{" "}
        <code>contact@isisel.com</code>.
      </p>

      <div className="acq-kpis" style={{ marginBottom: "1.1rem" }}>
        <button
          type="button"
          className={`acq-kpi ${stage === "" ? "acq-kpi--on" : ""}`}
          onClick={() => setStage("")}
        >
          <span className="acq-kpi__label">All</span>
          <span className="acq-kpi__value">{total}</span>
        </button>
        {INVESTOR_STAGES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`acq-kpi ${stage === item.id ? "acq-kpi--on" : ""}`}
            onClick={() => setStage(item.id)}
          >
            <span className="acq-kpi__label">{item.label}</span>
            <span className="acq-kpi__value">{counts[item.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, firm, proposal…"
          className="min-h-10 min-w-[16rem] flex-1 rounded-lg border border-[#ececec] bg-white px-3 text-sm"
        />
      </div>

      {error ? (
        <p className="mb-3 text-sm text-[var(--kama-danger)]">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ul className="space-y-2">
          {leads.length === 0 ? (
            <li className="rounded-xl border border-[#ececec] bg-white p-4 text-sm text-[#6b6b6b]">
              No investor proposals yet.
            </li>
          ) : (
            leads.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(lead);
                    setNotes(lead.notes || "");
                  }}
                  className={`w-full rounded-xl border bg-white p-4 text-left ${
                    selected?.id === lead.id
                      ? "border-[#0a0a0a]"
                      : "border-[#ececec]"
                  }`}
                >
                  <p className="font-semibold tracking-tight">{lead.name}</p>
                  <p className="text-sm text-[#5a5a5a]">{lead.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#6b6b6b]">
                    {investorStageLabel(lead.stage)}
                    {lead.organization ? ` · ${lead.organization}` : ""}
                    {` · ${formatWhen(lead.createdAt)}`}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>

        <aside className="rounded-xl border border-[#ececec] bg-white p-4">
          {selected ? (
            <div className="space-y-3 text-sm">
              <p className="text-lg font-semibold tracking-tight">{selected.name}</p>
              <p>
                <a className="underline" href={`mailto:${selected.email}`}>
                  {selected.email}
                </a>
              </p>
              {selected.organization ? <p>{selected.organization}</p> : null}
              {selected.role ? (
                <p className="text-[#5a5a5a]">{selected.role}</p>
              ) : null}
              {selected.firmUrl ? (
                <p>
                  <a
                    className="underline"
                    href={selected.firmUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selected.firmUrl}
                  </a>
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-[#5a5a5a]">
                {selected.proposal || "No proposal text."}
              </p>
              <p className="text-xs text-[#6b6b6b]">
                {selected.emailSentAt
                  ? `Emailed to contact@isisel.com ${formatWhen(selected.emailSentAt)}`
                  : selected.emailError
                    ? `Inbox email did not send: ${selected.emailError}`
                    : "Inbox email pending or not sent."}
              </p>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b6b6b]">
                Pipeline
                <select
                  className="mt-1 block w-full rounded-lg border border-[#ececec] px-2 py-2 text-sm"
                  value={selected.stage}
                  disabled={busy}
                  onChange={(e) => saveLead({ stage: e.target.value })}
                >
                  {INVESTOR_STAGES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b6b6b]">
                Notes
                <textarea
                  className="mt-1 min-h-28 w-full rounded-lg border border-[#ececec] px-2 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="ops-pill ops-pill--on"
                disabled={busy}
                onClick={() => saveLead({ notes })}
              >
                Save notes
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#6b6b6b]">
              Select a proposal to follow up.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
