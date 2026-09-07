export const STATUS_LABELS = {
  pending: "Needs cleaner",
  requested: "Requested",
  accepted: "Confirmed",
  declined: "Declined",
  scheduled: "Confirmed",
  en_route: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  issue_reported: "Issue",
  cancelled: "Cancelled",
};

export const STATUS_TONES = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  requested: "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] ring-[var(--kama-accent)]/20",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  declined: "bg-rose-50 text-rose-800 ring-rose-200",
  scheduled: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  en_route: "bg-sky-50 text-sky-800 ring-sky-200",
  in_progress: "bg-sky-50 text-sky-800 ring-sky-200",
  completed: "bg-[var(--kama-field)] text-[var(--kama-ink)] ring-[var(--kama-border)]",
  issue_reported: "bg-rose-50 text-rose-800 ring-rose-200",
  cancelled: "bg-[var(--kama-field)] text-[var(--kama-ink-muted)] ring-[var(--kama-border)]",
};

export const TYPE_LABELS = {
  checkout: "Checkout cleaning",
  regular: "Regular cleaning",
  deep: "Deep cleaning",
  emergency: "Emergency cleaning",
  custom: "Custom cleaning",
};

export function formatYmd(ymd, locale = "en") {
  if (!ymd) return "";
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" },
  );
}
