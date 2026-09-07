"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostInboxEmpty({ filter }) {
  const { t } = useLanguage();
  const titleKey =
    filter === "unread"
      ? "hostConsole.noUnread"
      : filter === "sent"
        ? "hostConsole.noSent"
        : "hostConsole.noMessages";

  return (
    <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
      <p className="font-medium text-[var(--kama-ink)]">{t(titleKey)}</p>
      <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
        {t("hostConsole.inboxHint")}
      </p>
    </div>
  );
}
