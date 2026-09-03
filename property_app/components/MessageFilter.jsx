"use client";

import Link from "next/link";

const FILTERS = [
  { label: "All Messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Sent", value: "sent" },
];

export default function MessageFilter({ currentFilter, basePath = "/messages" }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map(({ label, value }) => {
        const active = currentFilter === value;
        return (
          <Link
            key={value}
            href={`${basePath}?filter=${value}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--kama-accent)] text-white"
                : "border border-[var(--kama-border)] bg-[var(--kama-surface)] text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
