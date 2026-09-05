"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { onboardingHref } from "@/utils/audience/paths";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export const FOUNDING_HOSTS_HOME_MODAL_KEY = "isisel_founding_hosts_home_v1";

function shouldOpen(stats, dismissed) {
  if (dismissed) return false;
  if (!stats || stats.isFull) return false;
  if ((stats.spotsRemaining ?? 0) <= 0) return false;
  return true;
}

/**
 * Homepage invitation for the Founding Hosts program.
 * Live counter from the server. Dismissed until localStorage is cleared.
 */
export default function FoundingHostsHomeModal({ stats = null }) {
  const { t } = useLanguage();
  const titleId = useId();
  const [dismissed, setDismissed] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(FOUNDING_HOSTS_HOME_MODAL_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    const timer = window.setTimeout(() => setReady(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const open = ready && shouldOpen(stats, dismissed);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function dismiss() {
    try {
      localStorage.setItem(FOUNDING_HOSTS_HOME_MODAL_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!open || !stats) return null;

  const limit = stats.foundingHostLimit;
  const claimed = stats.claimedCount;
  const remaining = stats.spotsRemaining;
  const years = stats.foundingHostDurationYears;
  const ratePct = Math.round((Number(stats.foundingHostCommissionRate) || 0) * 100);
  const applyHref = onboardingHref("home", "founding-modal");

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={t("home.founding.close")}
        onClick={dismiss}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl">
        <div className="h-1 bg-[linear-gradient(90deg,var(--kama-accent),#2a7a73)]" />
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-2 text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
          aria-label={t("home.founding.close")}
        >
          <X size={18} aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-8 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
            {t("home.founding.eyebrow")}
          </p>
          <h2
            id={titleId}
            className="mt-2 font-display text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-[var(--kama-ink)]"
          >
            {t("home.founding.title", { n: limit })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
            {t("home.founding.body")}
          </p>

          <div className="mt-5 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-canvas)] px-4 py-3">
            <p className="text-sm font-medium tracking-tight text-[var(--kama-ink)]">
              {t("home.founding.claimed", { claimed, limit })}
            </p>
            <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
              {remaining === 1
                ? t("home.founding.remainingOne")
                : t("home.founding.remaining", { n: remaining })}
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[var(--kama-ink-muted)]">
            {t("home.founding.benefit", { rate: ratePct, years })}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={applyHref}
              className="kama-cta inline-flex h-12 items-center justify-center rounded-xl text-sm font-semibold"
            >
              {t("home.founding.apply")}
            </Link>
            <Link
              href="/founding-hosts"
              className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)]"
            >
              {t("home.founding.learnMore")}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="pt-1 text-center text-[13px] font-medium text-[var(--kama-ink-muted)] hover:underline"
            >
              {t("home.founding.notNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
