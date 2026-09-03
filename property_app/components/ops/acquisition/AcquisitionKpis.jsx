"use client";

import { KPI_DEFS } from "@/utils/acquisition/constants";

export default function AcquisitionKpis({ kpis = {}, active, onSelect }) {
  return (
    <div className="acq-kpis" role="toolbar" aria-label="Acquisition KPIs">
      {KPI_DEFS.map((kpi) => {
        const raw = kpis[kpi.id];
        const value =
          kpi.id === "conversion_rate"
            ? `${Number(raw || 0).toFixed(1)}%`
            : Number(raw || 0).toLocaleString();
        const on = active === kpi.id;
        const clickable = kpi.id !== "conversion_rate";
        return (
          <button
            key={kpi.id}
            type="button"
            className={`acq-kpi ${on ? "acq-kpi--on" : ""}`}
            onClick={() => {
              if (!clickable) return;
              onSelect?.(on ? "" : kpi.id);
            }}
            disabled={!clickable}
            aria-pressed={clickable ? on : undefined}
          >
            <span className="acq-kpi__label">{kpi.label}</span>
            <span className="acq-kpi__value">{value}</span>
          </button>
        );
      })}
    </div>
  );
}
