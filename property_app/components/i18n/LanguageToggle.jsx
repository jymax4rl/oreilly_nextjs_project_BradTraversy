"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function LanguageToggle({ className = "" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`inline-flex rounded-full border border-black/10 bg-white/80 p-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${className}`}
      role="group"
      aria-label={t("language")}
    >
      {[
        { id: "en", label: "EN" },
        { id: "fr", label: "FR" },
      ].map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLang(opt.id)}
            className={`rounded-full px-2 py-1 transition ${
              active
                ? "bg-[var(--kama-accent)] text-white"
                : "text-zinc-600 hover:text-zinc-900"
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
