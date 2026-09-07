"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const FILTERS = [
  { labelKey: "hostConsole.msg.all", value: "all" },
  { labelKey: "hostConsole.msg.unread", value: "unread" },
  { labelKey: "hostConsole.msg.sent", value: "sent" },
];

export default function MessageFilter({ currentFilter, basePath = "/messages" }) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map(({ labelKey, value }) => {
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
            {t(labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
