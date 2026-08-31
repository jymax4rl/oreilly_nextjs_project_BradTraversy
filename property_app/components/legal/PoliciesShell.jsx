"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LEGAL_DISCLAIMER,
  POLICIES_META,
  POLICY_SECTIONS,
  getSectionById,
} from "@/lib/legal/content";
import { TERMS_VERSION } from "@/lib/legal/constants";
import {
  normalizeLang,
  persistLang,
  resolveLang,
} from "@/lib/legal/acceptance";

function LangToggle({ lang, onChange }) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--kama-line,#d8e3e1)] bg-white p-0.5 text-sm font-semibold shadow-sm"
      role="group"
      aria-label="Language"
    >
      {[
        { id: "en", label: "English" },
        { id: "fr", label: "Français" },
      ].map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-3.5 py-1.5 transition ${
              active
                ? "bg-[var(--kama-accent)] text-white"
                : "text-[var(--kama-ink-muted,#4a5c5b)] hover:text-[var(--kama-ink,#0c1a1a)]"
            }`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * @param {{ initialSection?: string | null }} props
 */
export default function PoliciesShell({ initialSection = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = resolveLang(searchParams.get("lang"));
    setLang(next);
    setReady(true);
  }, [searchParams]);

  const meta = POLICIES_META[lang];
  const focusId = initialSection && getSectionById(initialSection)
    ? initialSection
    : null;

  const sections = useMemo(() => {
    if (!focusId) return POLICY_SECTIONS;
    const hit = getSectionById(focusId);
    return hit ? [hit] : POLICY_SECTIONS;
  }, [focusId]);

  const setLanguage = useCallback(
    (nextRaw) => {
      const next = normalizeLang(nextRaw);
      persistLang(next);
      setLang(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!ready || !focusId) return;
    const el = document.getElementById(focusId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, focusId, lang]);

  return (
    <div className="min-h-dvh bg-[var(--kama-canvas,#fafcfb)] text-[var(--kama-ink,#0c1a1a)]">
      <div
        className="border-b border-[var(--kama-line,#d8e3e1)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(27,92,87,0.08) 0%, rgba(250,252,251,0) 100%)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
              Kama Properties
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {meta.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--kama-ink-muted,#4a5c5b)]">
              {meta.subtitle}
            </p>
            <p className="mt-4 text-xs text-[var(--kama-ink-muted,#4a5c5b)]">
              {meta.lastUpdated}
              <span className="mx-2 text-[var(--kama-line,#d8e3e1)]">·</span>
              {meta.versionLabel}:{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-[11px]">
                {TERMS_VERSION}
              </code>
            </p>
          </div>
          <LangToggle lang={lang} onChange={setLanguage} />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--kama-ink-muted,#4a5c5b)]">
            {meta.toc}
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {POLICY_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={`/policies/${section.id}?lang=${lang}`}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition lg:whitespace-normal ${
                  focusId === section.id
                    ? "bg-[var(--kama-accent-soft,rgba(27,92,87,0.1))] font-semibold text-[var(--kama-accent)]"
                    : "text-[var(--kama-ink-muted,#4a5c5b)] hover:bg-white hover:text-[var(--kama-ink,#0c1a1a)]"
                }`}
              >
                {section.nav[lang]}
              </Link>
            ))}
            <Link
              href={`/policies?lang=${lang}`}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-[var(--kama-accent)] hover:bg-white lg:whitespace-normal"
            >
              {lang === "fr" ? "Voir tout" : "View all"}
            </Link>
          </nav>
        </aside>

        <main className="space-y-12">
          <div
            className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950"
            role="note"
          >
            {LEGAL_DISCLAIMER[lang]}
          </div>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 border-b border-[var(--kama-line,#d8e3e1)] pb-10 last:border-b-0"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink,#0c1a1a)]">
                {section.title[lang]}
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--kama-ink-muted,#3d4f4e)]">
                {section.paragraphs[lang].map((p, i) => (
                  <p key={`${section.id}-${i}`}>{p}</p>
                ))}
              </div>
            </section>
          ))}

          <p className="text-sm text-[var(--kama-ink-muted,#4a5c5b)]">
            <Link
              href={`/login?lang=${lang}`}
              className="font-semibold text-[var(--kama-accent)] underline-offset-2 hover:underline"
            >
              {lang === "fr" ? "Retour à la connexion" : "Back to sign in"}
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
