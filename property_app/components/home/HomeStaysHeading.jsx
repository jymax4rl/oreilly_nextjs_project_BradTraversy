"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HomeStaysHeading() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl px-5 pb-1 pt-5 text-center sm:px-6 sm:pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--kama-accent)]">
        {t("home.staysEyebrow")}
      </p>
      <h2 className="mt-2 text-[1.65rem] leading-snug text-[var(--kama-ink)] sm:text-3xl sm:text-4xl [font-family:var(--font-kama-display),Georgia,serif]">
        {t("home.staysTitle")}
      </h2>
    </div>
  );
}
