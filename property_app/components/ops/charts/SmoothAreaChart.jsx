"use client";

import { useId } from "react";
import { smoothPath, scaleSeries } from "@/components/ops/charts/chartGeometry";

const W = 800;
const H = 260;
const TEAL = "#1b5c57";
const GRID = "#e7eeec";
const LABEL = "#4a5c5b";

export default function SmoothAreaChart({
  series = [],
  label = "Page views",
  subtitle = "Last 24 hours · 15 min",
  emptyHint = "The curve fills in as guests browse the public site.",
  tickFormat,
}) {
  const rawId = useId().replace(/:/g, "");
  const fillId = `ops-area-fill-${rawId}`;

  const values = series.map((p) => Number(p.value ?? p.views) || 0);
  const hasSignal = values.some((v) => v > 0);
  const pts = scaleSeries(values.length ? values : [0], W, H, 28);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const area = `${line} L ${last.x} ${H - 28} L ${pts[0].x} ${H - 28} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => 28 + (H - 56) * (1 - t));
  const hourLabels = [];
  if (series.length > 1) {
    const step = Math.max(1, Math.floor(series.length / 6));
    for (let i = 0; i < series.length; i += step) {
      hourLabels.push({
        x: pts[i].x,
        text: tickFormat
          ? tickFormat(series[i].t)
          : formatHour(series[i].t),
      });
    }
  }

  return (
    <figure className="ops-card ops-chart-well">
      <figcaption className="ops-chart-caption">
        <span className="ops-chart-title">{label}</span>
        <span className="ops-chart-sub">{subtitle}</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[160px] w-full overflow-visible sm:h-[220px]"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.22" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((y) => (
          <line
            key={y}
            x1="28"
            x2={W - 16}
            y1={y}
            y2={y}
            stroke={GRID}
          />
        ))}

        {hasSignal ? (
          <>
            <path d={area} fill={`url(#${fillId})`} />
            <path
              d={line}
              fill="none"
              stroke={TEAL}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              className="ops-pulse"
              cx={last.x}
              cy={last.y}
              r="9"
              fill={TEAL}
            />
            <circle
              cx={last.x}
              cy={last.y}
              r="4.5"
              fill={TEAL}
              stroke="#fff"
              strokeWidth="2"
            />
          </>
        ) : (
          <path
            d={line}
            fill="none"
            stroke={GRID}
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        )}

        {hourLabels.map((h) => (
          <text
            key={`${h.x}-${h.text}`}
            x={h.x}
            y={H - 8}
            textAnchor="middle"
            fill={LABEL}
            fontSize="11"
          >
            {h.text}
          </text>
        ))}
      </svg>
      {!hasSignal ? (
        <p className="mt-1 text-[11px] text-[var(--kama-ink-muted)]">{emptyHint}</p>
      ) : null}
    </figure>
  );
}

function formatHour(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}
