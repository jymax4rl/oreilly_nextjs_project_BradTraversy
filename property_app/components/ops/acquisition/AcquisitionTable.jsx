"use client";

import {
  ACQUISITION_STAGES,
  ACQUISITION_SOURCES,
  ACQUISITION_PRIORITIES,
  sourceLabel,
  stageLabel,
  priorityLabel,
} from "@/utils/acquisition/constants";
import { formatDay, formatWhen, locationLine, followUpState } from "./format";

export default function AcquisitionTable({
  prospects = [],
  selected,
  onToggle,
  onToggleAll,
  onOpen,
  onSort,
  sort,
  dir,
}) {
  const allOn = prospects.length > 0 && prospects.every((p) => selected.has(p.id));

  const th = (key, label) => (
    <th>
      <button type="button" className="font-semibold" onClick={() => onSort(key)}>
        {label}
        {sort === key ? (dir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div className="acq-table-wrap">
      <table className="acq-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allOn}
                onChange={onToggleAll}
                aria-label="Select all on this page"
              />
            </th>
            {th("businessName", "Property / Business")}
            {th("contactName", "Owner")}
            <th>Location</th>
            <th>Phone</th>
            <th>Email</th>
            {th("source", "Source")}
            {th("propertyCount", "Properties")}
            {th("stage", "Stage")}
            {th("priority", "Priority")}
            {th("lastContactAt", "Last contact")}
            {th("nextFollowUpAt", "Next follow-up")}
            <th>Assigned</th>
            {th("createdAt", "Created")}
          </tr>
        </thead>
        <tbody>
          {prospects.length === 0 ? (
            <tr>
              <td colSpan={14} className="acq-empty">
                No prospects match these filters.
              </td>
            </tr>
          ) : (
            prospects.map((p) => {
              const state = followUpState(p.nextFollowUpAt);
              return (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => onToggle(p.id)}
                      aria-label={`Select ${p.businessName}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="font-medium text-[#0a0a0a]"
                      onClick={() => onOpen(p.id)}
                    >
                      {p.businessName}
                    </button>
                  </td>
                  <td>{p.contactName || "—"}</td>
                  <td>{locationLine(p)}</td>
                  <td>{p.phone || "—"}</td>
                  <td>{p.email || "—"}</td>
                  <td>{sourceLabel(p.source)}</td>
                  <td>{p.propertyCount ?? "—"}</td>
                  <td>{stageLabel(p.stage)}</td>
                  <td>
                    <span className={`acq-chip acq-chip--${p.priority}`}>
                      {priorityLabel(p.priority)}
                    </span>
                  </td>
                  <td>{formatWhen(p.lastContactAt)}</td>
                  <td>
                    {p.nextFollowUpAt ? (
                      <span className={state ? `acq-chip acq-chip--${state}` : ""}>
                        {state === "overdue" ? "Overdue · " : state === "today" ? "Due today · " : ""}
                        {formatWhen(p.nextFollowUpAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{p.assignedTo?.name || p.assignedTo?.email || "—"}</td>
                  <td>{formatDay(p.createdAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AcquisitionFilters({ filters, onChange, staff = [] }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <label className="acq-field">
        <span>Stage</span>
        <select value={filters.stage || ""} onChange={(e) => set("stage", e.target.value)}>
          <option value="">All stages</option>
          {ACQUISITION_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="acq-field">
        <span>Source</span>
        <select value={filters.source || ""} onChange={(e) => set("source", e.target.value)}>
          <option value="">All sources</option>
          {ACQUISITION_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="acq-field">
        <span>Priority</span>
        <select
          value={filters.priority || ""}
          onChange={(e) => set("priority", e.target.value)}
        >
          <option value="">All priorities</option>
          {ACQUISITION_PRIORITIES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="acq-field">
        <span>Assigned</span>
        <select
          value={filters.assignedTo || ""}
          onChange={(e) => set("assignedTo", e.target.value)}
        >
          <option value="">Anyone</option>
          {staff.map((u) => (
            <option key={u._id} value={u._id}>
              {u.username || u.email}
            </option>
          ))}
        </select>
      </label>
      <label className="acq-field">
        <span>Location</span>
        <input
          value={filters.city || ""}
          onChange={(e) => set("city", e.target.value)}
          placeholder="City"
        />
      </label>
      <label className="acq-field">
        <span>Follow-up</span>
        <select
          value={filters.followup || ""}
          onChange={(e) => set("followup", e.target.value)}
        >
          <option value="">Any</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <label className="acq-field">
        <span>Last contacted</span>
        <select
          value={filters.lastContacted || ""}
          onChange={(e) => set("lastContacted", e.target.value)}
        >
          <option value="">Any</option>
          <option value="never">Never</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="stale">Stale (14+ days)</option>
        </select>
      </label>
      <label className="acq-field">
        <span>Min properties</span>
        <input
          type="number"
          min="0"
          value={filters.propertyCountMin || ""}
          onChange={(e) => set("propertyCountMin", e.target.value)}
        />
      </label>
    </div>
  );
}
