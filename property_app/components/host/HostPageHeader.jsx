"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostPageHeader({ titleKey, blurbKey }) {
  const { t } = useLanguage();
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
        {t(titleKey)}
      </h1>
      {blurbKey ? (
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">{t(blurbKey)}</p>
      ) : null}
    </header>
  );
}
