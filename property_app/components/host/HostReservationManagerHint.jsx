"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostReservationManagerHint({ href }) {
  const { t } = useLanguage();
  return (
    <div className="mt-6 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 text-sm text-[var(--kama-ink-muted)]">
      <Link
        href={href}
        className="font-semibold text-[var(--kama-accent)] hover:underline"
      >
        {t("hostConsole.openReservationManager")}
      </Link>
      <span>{t("hostConsole.reservationManagerHint")}</span>
    </div>
  );
}
