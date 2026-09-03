"use client";

const TONE_CLASS = {
  teal: "ops-bar-fill--teal",
  ink: "ops-bar-fill--ink",
  amber: "ops-bar-fill--amber",
  green: "ops-bar-fill--green",
  stripe: "ops-bar-fill--stripe",
};

export default function GlowBarChart({
  bars = [],
  label = "Snapshot",
  subtitle,
  emptyHint,
}) {
  const max = Math.max(1, ...bars.map((b) => Number(b.value) || 0));
  const hasSignal = bars.some((b) => Number(b.value) > 0);

  return (
    <figure className="ops-card ops-chart-well">
      <figcaption className="ops-chart-caption">
        <span className="ops-chart-title">{label}</span>
        {subtitle ? <span className="ops-chart-sub">{subtitle}</span> : null}
      </figcaption>
      <div
        className="flex h-[148px] items-end justify-around gap-6 px-2 sm:h-[176px] sm:gap-10 sm:px-4"
        role="img"
        aria-label={label}
      >
        {bars.length === 0 ? (
          <p className="self-center text-[11px] text-[var(--kama-ink-muted)]">
            Loading…
          </p>
        ) : (
          bars.map((bar) => {
            const v = Number(bar.value) || 0;
            const h = Math.max(v > 0 ? 8 : 3, Math.round((v / max) * 96));
            const tone = TONE_CLASS[bar.tone] || TONE_CLASS.teal;
            return (
              <div key={bar.label} className="ops-bar-col">
                <span className="text-xs font-semibold tabular-nums text-[var(--kama-ink)]">
                  {v.toLocaleString()}
                </span>
                <div className="ops-bar-track">
                  <div
                    className={`ops-bar-fill ${tone}`}
                    style={{ height: `${h}px` }}
                    title={`${bar.label}: ${v}`}
                  />
                </div>
                <span className="text-center text-[10px] font-medium leading-tight text-[var(--kama-ink-muted)]">
                  {bar.label}
                </span>
              </div>
            );
          })
        )}
      </div>
      {!hasSignal && emptyHint ? (
        <p className="mt-2 text-[11px] text-[var(--kama-ink-muted)]">{emptyHint}</p>
      ) : null}
    </figure>
  );
}
