"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Settings2,
  X,
} from "lucide-react";
import { isOpsStaff, isSuperAdmin } from "@/utils/opsAuth";
import FoundingHostBadge from "@/components/foundingHosts/FoundingHostBadge";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired" },
  { id: "revoked", label: "Revoked" },
];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

function statusClass(status) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-800";
    case "expired":
      return "bg-amber-50 text-amber-800";
    case "revoked":
      return "bg-red-50 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function Kpi({ label, value, hint }) {
  return (
    <div className="ops-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[#0a0a0a]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-[#6b6b6b]">{hint}</p> : null}
    </div>
  );
}

function money(n) {
  return `USD ${(Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function OpsFoundingHostsPanel() {
  const { data: session } = useSession();
  const staff = isOpsStaff(session?.user?.role);
  const superadmin = isSuperAdmin(session?.user?.role);

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [hostQuery, setHostQuery] = useState("");
  const [hostResults, setHostResults] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      const [listRes, analyticsRes] = await Promise.all([
        fetch(`/api/ops/founding-hosts?${params}`, { cache: "no-store" }),
        fetch("/api/ops/founding-hosts/analytics", { cache: "no-store" }),
      ]);
      if (!listRes.ok) throw new Error(await listRes.text());
      const list = await listRes.json();
      setStats(list.stats);
      setHosts(list.hosts || []);
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      setError(err.message || "Failed to load Founding Hosts");
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    if (!staff) return;
    const t = window.setTimeout(load, 200);
    return () => window.clearTimeout(t);
  }, [staff, load]);

  async function openDetails(host) {
    setSelected(host);
    setHistory([]);
    try {
      const res = await fetch(`/api/ops/founding-hosts/${host.id}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelected(data.host);
      setHistory(data.history || []);
    } catch {
      /* ignore */
    }
  }

  async function runAction(userId, action, payload = {}) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/ops/founding-hosts/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");
      setDialog(null);
      await load();
      if (data.host) {
        setSelected(data.host);
        await openDetails(data.host);
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadSettings() {
    const res = await fetch("/api/ops/founding-hosts/settings", {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setSettings(data.settings);
    setSettingsOpen(true);
  }

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const percent = Number(form.get("commissionPercent"));
      const res = await fetch("/api/ops/founding-hosts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foundingHostLimit: Number(form.get("foundingHostLimit")),
          foundingHostCommissionRate: Number.isFinite(percent)
            ? percent / 100
            : 0,
          foundingHostDurationYears: Number(form.get("foundingHostDurationYears")),
          programStatus: form.get("programStatus"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save settings");
      setSettings(data.settings);
      setSettingsOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function searchHosts(q) {
    setHostQuery(q);
    if (q.trim().length < 2) {
      setHostResults([]);
      return;
    }
    const res = await fetch(
      `/api/ops/users?filter=host&q=${encodeURIComponent(q.trim())}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setHostResults(data.users || []);
  }

  const claimedLabel = useMemo(() => {
    if (!stats) return "";
    return `${stats.spotsClaimed} / ${stats.totalSpots} claimed`;
  }, [stats]);

  if (!staff) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
            Founding 100
          </p>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            {claimedLabel}
            {stats ? ` · ${stats.spotsRemaining} spots remaining` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialog({ type: "pick-host" })}
            className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-white"
          >
            Grant to a host
          </button>
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececec] bg-white px-3 py-2 text-xs font-semibold text-[#0a0a0a]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          label="Spots claimed"
          value={stats ? `${stats.spotsClaimed} / ${stats.totalSpots}` : "—"}
          hint={stats ? `${stats.spotsRemaining} remaining` : ""}
        />
        <Kpi label="Active" value={stats?.activeFoundingHosts ?? "—"} />
        <Kpi label="Expired" value={stats?.expiredFoundingHosts ?? "—"} />
        <Kpi
          label="Program"
          value={stats?.programStatus === "paused" ? "Paused" : "Active"}
        />
      </div>

      {analytics ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Kpi label="Bookings by Founding Hosts" value={analytics.bookingsGenerated} />
          <Kpi label="Gross booking value" value={money(analytics.grossBookingValue)} />
          <Kpi label="Commission waived" value={money(analytics.commissionWaived)} />
        </div>
      ) : null}

      <div className="ops-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#ececec] px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="h-10 w-full rounded-xl border border-[#ececec] bg-white pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  status === item.id
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-[#f4f4f4] text-[#4b4b4b]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="px-4 py-10 text-sm text-[#6b6b6b]">Loading…</p>
        ) : hosts.length === 0 ? (
          <p className="px-4 py-10 text-sm text-[#6b6b6b]">
            No Founding Hosts yet. Spots are assigned when a host’s first listing
            is approved — or grant one manually.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8a]">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Host</th>
                  <th className="px-4 py-2 font-medium">Granted</th>
                  <th className="px-4 py-2 font-medium">Expires</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((host) => (
                  <tr
                    key={host.id}
                    className="cursor-pointer border-t border-[#f0f0f0] hover:bg-[#fafafa]"
                    onClick={() => openDetails(host)}
                  >
                    <td className="px-4 py-3 tabular-nums font-semibold">
                      {host.foundingHost.number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0a0a0a]">
                        {host.username || "—"}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{host.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#4b4b4b]">
                      {formatDate(host.foundingHost.grantedAt)}
                    </td>
                    <td className="px-4 py-3 text-[#4b4b4b]">
                      {formatDate(host.foundingHost.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(
                          host.foundingHost.status,
                        )}`}
                      >
                        {host.foundingHost.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <HostDrawer
          host={selected}
          history={history}
          busy={busy}
          superadmin={superadmin}
          remaining={stats?.spotsRemaining ?? 0}
          onClose={() => setSelected(null)}
          onAction={(action, payload) => runAction(selected.id, action, payload)}
          onDialog={setDialog}
        />
      ) : null}

      {settingsOpen && settings ? (
        <Modal title="Founding Host settings" onClose={() => setSettingsOpen(false)}>
          <form onSubmit={saveSettings} className="space-y-3">
            <Field label="Founding Host limit">
              <input
                name="foundingHostLimit"
                type="number"
                min="1"
                defaultValue={settings.foundingHostLimit}
                className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
              />
            </Field>
            <Field label="Commission rate (%)">
              <input
                name="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={Math.round(settings.foundingHostCommissionRate * 1000) / 10}
                className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
              />
            </Field>
            <Field label="Duration (years)">
              <input
                name="foundingHostDurationYears"
                type="number"
                min="1"
                max="50"
                defaultValue={settings.foundingHostDurationYears}
                className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
              />
            </Field>
            <Field label="Program status">
              <select
                name="programStatus"
                defaultValue={settings.programStatus}
                className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </Field>
            <p className="text-xs text-[#6b6b6b]">
              Changing the limit does not invalidate hosts already granted.
              Pausing stops automatic assignment on host approval.
            </p>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#0a0a0a] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save settings
            </button>
          </form>
        </Modal>
      ) : null}

      {dialog?.type === "pick-host" ? (
        <Modal title="Grant to a host" onClose={() => setDialog(null)}>
          <p className="mb-3 text-sm text-[#6b6b6b]">
            Search a verified host. Granting Founding Host consumes a program
            position. Commission-free does not.
          </p>
          <input
            value={hostQuery}
            onChange={(e) => searchHosts(e.target.value)}
            placeholder="Name or email"
            className="mb-3 h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {hostResults.map((user) => (
              <li key={user._id}>
                <div className="rounded-xl border border-[#ececec] px-3 py-2">
                  <p className="text-sm font-medium">{user.username || user.email}</p>
                  <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-[#0a0a0a] px-2.5 py-1 text-xs font-semibold text-white"
                      onClick={() =>
                        setDialog({
                          type: "grant-founding",
                          userId: user._id,
                          name: user.username || user.email,
                        })
                      }
                    >
                      Founding Host
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-[#ececec] px-2.5 py-1 text-xs font-semibold"
                      onClick={() =>
                        setDialog({
                          type: "commission-free",
                          userId: user._id,
                          name: user.username || user.email,
                        })
                      }
                    >
                      Commission-free
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {dialog?.type === "grant-founding" ? (
        <ConfirmForm
          title="Grant Founding Host"
          warning="This action will assign a Founding Host position."
          busy={busy}
          onClose={() => setDialog(null)}
          extra={
            stats?.spotsRemaining <= 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                All positions are claimed.
                {superadmin
                  ? " Superadmin override will be sent with this request."
                  : " A superadmin override is required."}
              </p>
            ) : null
          }
          onSubmit={(form) =>
            runAction(dialog.userId, "grant", {
              reason: form.get("reason"),
              notes: form.get("notes"),
              overrideLimit: stats?.spotsRemaining <= 0 && superadmin,
            })
          }
        />
      ) : null}

      {dialog?.type === "commission-free" ? (
        <CommissionFreeForm
          title={`Grant commission-free · ${dialog.name || ""}`}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(payload) =>
            runAction(dialog.userId, "commission-free", payload)
          }
        />
      ) : null}

      {dialog?.type === "revoke" ? (
        <ConfirmForm
          title="Revoke Founding Host"
          warning="The number will not be given to another host."
          busy={busy}
          destructive
          onClose={() => setDialog(null)}
          onSubmit={(form) =>
            runAction(selected.id, "revoke", {
              reason: form.get("reason"),
              notes: form.get("notes"),
            })
          }
        />
      ) : null}

      {dialog?.type === "extend" ? (
        <ConfirmForm
          title="Extend expiration"
          busy={busy}
          dateField
          onClose={() => setDialog(null)}
          onSubmit={(form) =>
            runAction(selected.id, "extend", {
              expiresAt: form.get("expiresAt"),
              reason: form.get("reason"),
              notes: form.get("notes"),
            })
          }
        />
      ) : null}

      {dialog?.type === "commission-free-revoke-confirm" && selected ? (
        <ConfirmForm
          title="Revoke commission-free"
          warning="This does not affect Founding Host status or consume a program position."
          busy={busy}
          destructive
          onClose={() => setDialog(null)}
          onSubmit={(form) =>
            runAction(selected.id, "commission-free-revoke", {
              reason: form.get("reason"),
              notes: form.get("notes"),
            })
          }
        />
      ) : null}
    </div>
  );
}

function HostDrawer({
  host,
  history,
  busy,
  onClose,
  onDialog,
}) {
  const fh = host.foundingHost || {};
  const override = host.commissionOverride || {};
  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/30">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#ececec] px-5 py-4">
          <div>
            <FoundingHostBadge number={fh.number} />
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              {host.username || host.email}
            </h2>
            <p className="text-sm text-[#6b6b6b]">{host.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <Item label="Number">#{fh.number}</Item>
            <Item label="Status">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(fh.status)}`}>
                {fh.status}
              </span>
            </Item>
            <Item label="Granted">{formatDate(fh.grantedAt)}</Item>
            <Item label="Expires">{formatDate(fh.expiresAt)}</Item>
            <Item label="Granted by">{fh.grantedBy || "—"}</Item>
            <Item label="Reason">{fh.grantReason || "—"}</Item>
          </dl>

          <section className="rounded-xl border border-[#ececec] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              Manual commission-free
            </p>
            {override.enabled ? (
              <p className="mt-2 text-sm">
                {Math.round((override.rate || 0) * 100)}% · {formatDate(override.startsAt)} →{" "}
                {formatDate(override.expiresAt)}
                <br />
                <span className="text-[#6b6b6b]">{override.reason || "—"}</span>
              </p>
            ) : (
              <p className="mt-2 text-[#6b6b6b]">None on this host.</p>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            {fh.status !== "revoked" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDialog({ type: "extend" })}
                  className="rounded-xl border border-[#ececec] px-3 py-2 text-xs font-semibold"
                >
                  Extend expiration
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDialog({ type: "revoke" })}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Revoke Founding Host
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onDialog({
                  type: "commission-free",
                  userId: host.id,
                  name: host.username || host.email,
                })
              }
              className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-white"
            >
              Grant commission-free
            </button>
            {override.enabled ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDialog({ type: "commission-free-revoke-confirm" })}
                className="rounded-xl border border-[#ececec] px-3 py-2 text-xs font-semibold"
              >
                Revoke commission-free
              </button>
            ) : null}
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              History
            </p>
            {history.length === 0 ? (
              <p className="mt-2 text-[#6b6b6b]">No audit events yet.</p>
            ) : (
              <ol className="mt-2 space-y-2">
                {history.map((event) => (
                  <li key={event.id} className="rounded-xl bg-[#f7f7f6] px-3 py-2">
                    <p className="font-medium">{event.action.replaceAll("_", " ")}</p>
                    <p className="text-xs text-[#6b6b6b]">
                      {formatDate(event.createdAt)} · {event.actor?.name || event.actor?.email || "Ops"}
                    </p>
                    {event.reason ? (
                      <p className="mt-1 text-xs">{event.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <footer className="border-t border-[#ececec] px-5 py-3">
          <Link
            href="/ops/users"
            className="text-xs font-semibold text-[#1b5c57]"
          >
            Open in Users
          </Link>
        </footer>
      </aside>
    </div>
  );
}

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8a]">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-[#6b6b6b]">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmForm({
  title,
  warning,
  extra,
  busy,
  destructive,
  dateField,
  onClose,
  onSubmit,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        {warning ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {warning}
          </p>
        ) : null}
        {extra}
        {dateField ? (
          <Field label="New expiration">
            <input
              name="expiresAt"
              type="date"
              required
              className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
            />
          </Field>
        ) : null}
        <Field label="Reason">
          <input
            name="reason"
            required
            className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
        </Field>
        <Field label="Internal notes">
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-xl border border-[#ececec] px-3 py-2 text-sm"
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
            destructive ? "bg-red-600" : "bg-[#0a0a0a]"
          }`}
        >
          Confirm
        </button>
      </form>
    </Modal>
  );
}

function CommissionFreeForm({ title, busy, onClose, onSubmit }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-3 text-xs text-[#6b6b6b]">
        This does not consume a Founding Host position.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          onSubmit({
            rate: Number(form.get("percent")) / 100,
            startsAt: form.get("startsAt"),
            expiresAt: form.get("expiresAt"),
            reason: form.get("reason"),
            notes: form.get("notes"),
          });
        }}
      >
        <Field label="Commission (%)">
          <input
            name="percent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue="0"
            className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
        </Field>
        <Field label="Start">
          <input
            name="startsAt"
            type="date"
            required
            className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
        </Field>
        <Field label="Expiration">
          <input
            name="expiresAt"
            type="date"
            required
            className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
        </Field>
        <Field label="Reason">
          <input
            name="reason"
            required
            placeholder="Strategic partner"
            className="h-10 w-full rounded-xl border border-[#ececec] px-3 text-sm"
          />
        </Field>
        <Field label="Internal notes">
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-xl border border-[#ececec] px-3 py-2 text-sm"
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#0a0a0a] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Grant commission-free
        </button>
      </form>
    </Modal>
  );
}
