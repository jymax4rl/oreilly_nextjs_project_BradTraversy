"use client";

import Link from "next/link";
import { useState } from "react";
import { TERMS_VERSION } from "@/lib/legal/constants";
import { persistTermsAcceptance } from "@/lib/legal/acceptance";

const COPY = {
  en: {
    title: "Before you continue",
    body: "Please review and accept the Terms & Conditions to sign in to Kama Properties. This protects guests and hosts on our African vacation rentals marketplace.",
    checkbox: "I agree to the Terms & Conditions",
    link: "Read full Terms & Policies",
    continue: "Continue to sign in",
    version: "Version",
    disclaimer:
      "Product template — not formal legal advice. Counsel may review updates later.",
  },
  fr: {
    title: "Avant de continuer",
    body: "Veuillez lire et accepter les Conditions d’utilisation pour vous connecter à Kama Properties. Cela protège voyageurs et hôtes sur notre marketplace de locations en Afrique.",
    checkbox: "J’accepte les Conditions d’utilisation",
    link: "Lire les Conditions et Politiques",
    continue: "Continuer vers la connexion",
    version: "Version",
    disclaimer:
      "Modèle produit — pas un avis juridique formel. Un conseil pourra les revoir ultérieurement.",
  },
};

/**
 * @param {{ lang?: "en" | "fr", onAccepted: () => void }} props
 */
export default function TermsAcceptanceGate({ lang = "en", onAccepted }) {
  const [checked, setChecked] = useState(false);
  const t = COPY[lang] || COPY.en;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[400px] flex-1 flex-col justify-center px-1 pt-10 sm:px-0 lg:pt-0">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
        Kama Properties
      </p>
      <h1 className="mt-3 text-center text-[1.65rem] font-semibold tracking-tight break-words text-zinc-900 lg:text-left lg:text-3xl">
        {t.title}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed break-words text-zinc-500 lg:text-left">
        {t.body}
      </p>

      <label className="mt-8 flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 accent-[var(--kama-accent)]"
        />
        <span className="min-w-0 flex-1 text-sm leading-snug break-words [overflow-wrap:anywhere] text-zinc-800">
          {t.checkbox}{" "}
          <Link
            href={`/policies/terms?lang=${lang}`}
            className="font-semibold text-[var(--kama-accent)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ({t.link})
          </Link>
        </span>
      </label>

      <p className="mt-3 text-xs break-words text-zinc-400">
        {t.version}: <code className="text-[11px]">{TERMS_VERSION}</code>
      </p>

      <button
        type="button"
        disabled={!checked}
        onClick={() => {
          persistTermsAcceptance(TERMS_VERSION);
          onAccepted();
        }}
        className="kama-cta mt-6 flex h-[52px] w-full items-center justify-center rounded-xl text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t.continue}
      </button>

      <p className="mt-6 text-center text-xs leading-relaxed break-words text-zinc-400 lg:text-left">
        {t.disclaimer}
      </p>
    </div>
  );
}
