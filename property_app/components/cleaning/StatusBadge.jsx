import { STATUS_LABELS, STATUS_TONES } from "@/utils/cleaners/status";

export default function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_TONES[status] || STATUS_TONES.pending} ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
