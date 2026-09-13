"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Shared unavailable-page for unmatched routes and listing notFound().
 * Calm, on-brand copy — no “under construction” or cartoon 404.
 */
export default function MissingPage({ variant = "page" }) {
  const { t } = useLanguage();
  const listing = variant === "listing";

  return (
    <div className="flex min-h-[calc(100dvh-8vh)] items-center bg-[var(--kama-canvas)] px-6 py-20 sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--kama-accent)]">
          {t(listing ? "notFound.listingKicker" : "notFound.kicker")}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[2.35rem] sm:leading-tight">
          {t(listing ? "notFound.listingTitle" : "notFound.title")}
        </h1>
        <p className="mt-4 max-w-md text-[0.975rem] leading-relaxed text-[var(--kama-ink-muted)]">
          {t(listing ? "notFound.listingBody" : "notFound.body")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-full bg-[var(--kama-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)]"
          >
            {t("notFound.browse")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-[var(--kama-border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--kama-ink)] transition hover:bg-[var(--kama-canvas-soft)]"
          >
            {t("notFound.contact")}
          </Link>
        </div>
      </div>
    </div>
  );
}
