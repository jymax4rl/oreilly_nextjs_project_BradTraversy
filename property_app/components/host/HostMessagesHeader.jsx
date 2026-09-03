"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostMessagesHeader({ unreadCount }) {
  const { t } = useLanguage();
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
        {t("hostConsole.inboxTitle")}
      </h1>
      {unreadCount > 0 ? (
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
          {t("hostConsole.unreadCount", { n: unreadCount })}
        </p>
      ) : null}
    </header>
  );
}
