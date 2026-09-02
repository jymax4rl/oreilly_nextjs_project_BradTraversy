"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isOpsStaff } from "@/utils/opsAuth";
import { Search, Plus, Download, Upload, Headset } from "lucide-react";
import Link from "next/link";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";
import AcquisitionKpis from "./AcquisitionKpis";
import AcquisitionToday from "./AcquisitionToday";
import AcquisitionBoard from "./AcquisitionBoard";
import AcquisitionTable, { AcquisitionFilters } from "./AcquisitionTable";
import AcquisitionProspectForm from "./AcquisitionProspectForm";
import AcquisitionDrawer from "./AcquisitionDrawer";
import AcquisitionInsights from "./AcquisitionInsights";
import AcquisitionQuickActions from "./AcquisitionQuickActions";
import { followUpState, formatWhen, locationLine } from "./format";
import { sourceLabel, priorityLabel, stageLabel } from "@/utils/acquisition/constants";
import "./acquisition.css";

const SEARCH_DEBOUNCE_MS = 280;

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export default function OpsAcquisitionPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("board");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    kpi: "",
    stage: "",
    source: "",
    priority: "",
    city: "",
    assignedTo: "",
    followup: "",
    lastContacted: "",
    propertyCountMin: "",
    sort: "updatedAt",
    dir: "desc",
    page: "1",
  });
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [drawerId, setDrawerId] = useState(null);
  const [drawerIntent, setDrawerIntent] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setView("list");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput, page: "1" }));
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadSummary = useCallback(async (signal) => {
    const res = await fetch("/api/ops/acquisition/summary", {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error("Failed to load KPIs");
    setSummary(await res.json());
  }, []);

  const loadProspects = useCallback(
    async (signal) => {
      const params = buildQuery({
        ...filters,
        view: view === "board" ? "board" : undefined,
        limit: view === "board" || view === "list" ? "80" : "40",
      });
      const res = await fetch(`/api/ops/acquisition/prospects?${params}`, {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!res.ok) throw new Error("Failed to load prospects");
      const data = await res.json();
      setProspects(data.prospects || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    },
    [filters, view],
  );

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadSummary(controller.signal), loadProspects(controller.signal)]);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [status, session, loadSummary, loadProspects]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;
    fetch("/api/ops/users?filter=staff", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setStaff(data.users || []))
      .catch(() => {});
  }, [status, session]);

  async function refresh() {
    await Promise.all([loadSummary(), loadProspects()]);
  }

  async function moveStage(id, stage) {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    const res = await fetch(`/api/ops/acquisition/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) refresh();
    else loadSummary();
  }

  function openProspect(id, intent = "") {
    setDrawerId(id);
    setDrawerIntent(intent);
  }

  async function bulk(action, extra = {}) {
    if (!selected.size) return;
    if (action === "delete" && !window.confirm(`Delete ${selected.size} prospects? This cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/ops/acquisition/prospects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: [...selected], action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function runImport(dryRun) {
    setImportMsg("");
    const res = await fetch("/api/ops/acquisition/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ csv: csvText, dryRun }),
    });
    const data = await res.json();
    if (!res.ok) {
      setImportMsg(data.error || "Import failed");
      if (data.errors?.length) {
        setImportMsg(
          `${data.error || "Errors"}: ${data.errors
            .slice(0, 5)
            .map((e) => `line ${e.line} ${e.error}`)
            .join("; ")}`,
        );
      }
      return;
    }
    setImportMsg(
      dryRun
        ? `${data.ready} rows ready${data.errors?.length ? `, ${data.errors.length} errors` : ""}`
        : `Imported ${data.imported} prospects`,
    );
    if (!dryRun) {
      setImportOpen(false);
      setCsvText("");
      refresh();
    }
  }

  const exportHref = useMemo(() => {
    const params = buildQuery(filters);
    return `/api/ops/acquisition/export?${params}`;
  }, [filters]);

  if (status === "loading") {
    return <div className="py-16 text-center text-sm text-[#6b6b6b]">Loading…</div>;
  }
  if (!isOpsStaff(session?.user?.role)) return null;

  return (
    <div>
      <OpsMarketingSubnav />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-[13px] leading-relaxed text-[#6b6b6b]">
          Find → research → contact → follow up → onboard. Open this page to know who
          to call today, who is waiting, and which channel is actually converting hosts.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <a
            href={exportHref}
            className="inline-flex items-center gap-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm"
          >
            <Download className="h-4 w-4" /> Export
          </a>
          <Link
            href="/ops/marketing/acquisition/copilot"
            className="inline-flex items-center gap-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm"
          >
            <Headset className="h-4 w-4" /> Sales Copilot
          </Link>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#111] px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add prospect
          </button>
        </div>
      </div>

      <AcquisitionKpis
        kpis={summary?.kpis}
        active={filters.kpi}
        onSelect={(kpi) => setFilters((prev) => ({ ...prev, kpi, page: "1" }))}
      />

      <AcquisitionToday today={summary?.today} onOpen={openProspect} />

      <div className="mt-6 mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, owner, phone, email, city…"
            className="h-11 w-full rounded-lg border border-[#ececec] bg-white pl-10 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["board", "Pipeline"],
            ["list", "Cards"],
            ["table", "Table"],
            ["followups", "Follow-ups"],
            ["insights", "Insights"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                if (id === "followups") {
                  setFilters((prev) => ({
                    ...prev,
                    followup: prev.followup || "today",
                    page: "1",
                  }));
                }
              }}
              className={`ops-pill ${view === id ? "ops-pill--on" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view !== "insights" ? (
        <div className="mb-4">
          <AcquisitionFilters
            filters={filters}
            onChange={(next) => setFilters({ ...next, page: "1" })}
            staff={staff}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm">
          <span>{selected.size} selected</span>
          <button type="button" disabled={bulkBusy} onClick={() => bulk("stage", { stage: "contacted" })}>
            Mark contacted
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => bulk("priority", { priority: "high" })}>
            High priority
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => bulk("archive")}>
            Archive
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => bulk("delete")}>
            Delete
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-sm text-[#6b6b6b]">Loading pipeline…</p>
      ) : view === "insights" ? (
        <AcquisitionInsights summary={summary} />
      ) : view === "board" ? (
        prospects.length === 0 ? (
          <div className="ops-card acq-empty">
            No prospects yet. Add the first host you want to win.
          </div>
        ) : (
          <AcquisitionBoard
            prospects={prospects}
            onOpen={openProspect}
            onMoveStage={moveStage}
          />
        )
      ) : view === "table" ? (
        <>
          <AcquisitionTable
            prospects={prospects}
            selected={selected}
            onToggle={(id) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onToggleAll={() =>
              setSelected((prev) => {
                if (prospects.every((p) => prev.has(p.id))) return new Set();
                return new Set(prospects.map((p) => p.id));
              })
            }
            onOpen={openProspect}
            sort={filters.sort}
            dir={filters.dir}
            onSort={(key) =>
              setFilters((prev) => ({
                ...prev,
                sort: key,
                dir: prev.sort === key && prev.dir === "desc" ? "asc" : "desc",
              }))
            }
          />
          <div className="mt-3 flex items-center justify-between text-sm text-[#6b6b6b]">
            <span>
              {total} prospects · page {filters.page} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={Number(filters.page) <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: String(Number(prev.page) - 1) }))
                }
              >
                Previous
              </button>
              <button
                type="button"
                disabled={Number(filters.page) >= pages}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: String(Number(prev.page) + 1) }))
                }
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <ul className="grid gap-2">
          {prospects.length === 0 ? (
            <li className="ops-card acq-empty">No prospects in this view.</li>
          ) : (
            prospects
              .filter((p) => (view === "followups" ? p.nextFollowUpAt : true))
              .map((p) => {
                const state = followUpState(p.nextFollowUpAt);
                return (
                  <li key={p.id} className="acq-card">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => openProspect(p.id)}
                    >
                      <p className="acq-card__name">{p.businessName}</p>
                      <p className="acq-card__meta">
                        {p.contactName || "No owner"} · {locationLine(p)} · {sourceLabel(p.source)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`acq-chip acq-chip--${p.priority}`}>
                          {priorityLabel(p.priority)}
                        </span>
                        <span className="acq-chip acq-chip--low">{stageLabel(p.stage)}</span>
                        {state ? (
                          <span className={`acq-chip acq-chip--${state}`}>
                            {state === "overdue"
                              ? "Overdue"
                              : state === "today"
                                ? "Due today"
                                : formatWhen(p.nextFollowUpAt)}
                          </span>
                        ) : null}
                      </div>
                    </button>
                    <div className="mt-2">
                      <AcquisitionQuickActions
                        prospect={p}
                        onFollowUp={() => openProspect(p.id, "followup")}
                        onNote={() => openProspect(p.id, "note")}
                      />
                    </div>
                  </li>
                );
              })
          )}
        </ul>
      )}

      <AcquisitionProspectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => refresh()}
        staff={staff}
        sessionUser={session?.user}
      />

      {drawerId ? (
        <AcquisitionDrawer
          prospectId={drawerId}
          intent={drawerIntent}
          onClose={() => setDrawerId(null)}
          onChanged={() => refresh()}
        />
      ) : null}

      {importOpen ? (
        <div className="acq-modal" role="dialog">
          <div className="acq-modal__panel">
            <div className="mb-3 flex justify-between">
              <h2 className="text-lg font-semibold">Import CSV</h2>
              <button type="button" onClick={() => setImportOpen(false)}>
                Close
              </button>
            </div>
            <p className="text-[13px] text-[#6b6b6b]">
              Header row required. Include a Business / Property Name column. Optional:
              owner, phone, email, whatsapp, city, country, source, priority, stage, notes.
            </p>
            <textarea
              className="mt-3 min-h-40 w-full rounded-lg border border-[#ececec] p-3 font-mono text-xs"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            {importMsg ? <p className="mt-2 text-sm">{importMsg}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-sm"
                onClick={() => runImport(true)}
              >
                Validate
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#111] px-3 py-2 text-sm text-white"
                onClick={() => runImport(false)}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
