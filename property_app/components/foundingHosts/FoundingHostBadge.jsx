/**
 * Reusable Founding Host recognition badge.
 * Does not expose ops internals. Safe on host-facing surfaces.
 */
export default function FoundingHostBadge({
  number,
  compact = false,
  className = "",
}) {
  const label =
    number != null && Number.isFinite(Number(number))
      ? `#${number} Founding Host`
      : "Founding Host";

  return (
    <span
      className={`inline-flex items-center rounded-full bg-[var(--kama-accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--kama-accent)] ${className}`}
      title={compact ? label : undefined}
    >
      {compact && number != null ? `#${number}` : label}
    </span>
  );
}
