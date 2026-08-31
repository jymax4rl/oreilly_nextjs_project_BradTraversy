"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { X } from "lucide-react";
import GoogleIcon from "@/components/auth/GoogleIcon";
import BrandLogo from "@/components/BrandLogo";
import TermsAcceptanceGate from "@/components/legal/TermsAcceptanceGate";
import heroImage from "@/assets/images/modernMansion01.png";
import {
  hasAcceptedCurrentTerms,
  normalizeLang,
  persistLang,
  readTermsAcceptance,
  resolveLang,
} from "@/lib/legal/acceptance";
import { TERMS_VERSION } from "@/lib/legal/constants";

/** Never leave the full-page teal spinner up forever if session fetch stalls. */
const SESSION_WAIT_MS = 2500;

function LoginSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--kama-canvas)]">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

async function syncTermsToServer() {
  const record = readTermsAcceptance();
  if (!record || record.version !== TERMS_VERSION) return;
  try {
    await fetch("/api/user/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: record.version }),
    });
  } catch {
    /* non-blocking — local acceptance already stored */
  }
}

function LoginContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [sessionWaitTimedOut, setSessionWaitTimedOut] = useState(false);
  const [redirectStalled, setRedirectStalled] = useState(false);
  const [termsReady, setTermsReady] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [lang, setLang] = useState("en");

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  useEffect(() => {
    const nextLang = resolveLang(searchParams.get("lang"));
    setLang(nextLang);
    persistLang(nextLang);
    setTermsAccepted(hasAcceptedCurrentTerms());
    setTermsReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (status !== "loading") {
      setSessionWaitTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setSessionWaitTimedOut(true), SESSION_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setRedirectStalled(false);
      return;
    }
    let cancelled = false;
    let navTimer;
    let stallTimer;
    (async () => {
      await syncTermsToServer();
      if (cancelled) return;
      navTimer = window.setTimeout(() => {
        window.location.assign(callbackUrl);
      }, 50);
      stallTimer = window.setTimeout(
        () => setRedirectStalled(true),
        SESSION_WAIT_MS,
      );
    })();
    return () => {
      cancelled = true;
      if (navTimer) window.clearTimeout(navTimer);
      if (stallTimer) window.clearTimeout(stallTimer);
    };
  }, [status, callbackUrl]);

  // Full-page spinner ONLY while session is genuinely loading, and only briefly.
  if (status === "loading" && !sessionWaitTimedOut) {
    return <LoginSpinner />;
  }

  // Authenticated: brief spinner while we navigate to callback (e.g. /properties/add).
  if (status === "authenticated" && !redirectStalled) {
    return <LoginSpinner />;
  }

  // Timed out while "authenticated" but still here — offer escape hatch.
  if (status === "authenticated" && redirectStalled) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--kama-canvas)] px-6 text-center">
        <p className="text-sm text-[var(--kama-ink-muted)]">
          Signed in as {session?.user?.email || "your account"}. Redirect is slow —
          continue manually.
        </p>
        <a
          href={callbackUrl}
          className="kama-cta inline-flex min-h-[48px] items-center rounded-full px-8 text-sm font-bold"
        >
          Continue
        </a>
        <Link href="/" className="text-sm text-[var(--kama-ink-muted)] underline">
          Go home
        </Link>
      </div>
    );
  }

  const showGate = termsReady && !termsAccepted;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--kama-canvas)] lg:flex-row">
      {/* Hero — desktop */}
      <div className="relative hidden min-h-dvh flex-1 overflow-hidden lg:block">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(12,26,26,0.45) 0%, rgba(27,92,87,0.55) 48%, rgba(12,26,26,0.88) 100%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            Kama Properties
          </p>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            African stays.
            <br />
            <span className="text-[#c8e6e0]">Global guests.</span>
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
            Book unique homes across the continent — or open your doors to
            travelers with Mobile Money–friendly payments.
          </p>
        </div>
      </div>

      {/* Auth panel */}
      <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-10 lg:max-w-[520px] lg:px-14 lg:py-12">
        <Link
          href="/"
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 lg:left-6"
          aria-label="Close and return home"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex gap-1 rounded-full border border-zinc-200 bg-white p-0.5 text-xs font-semibold shadow-sm lg:right-6">
          {["en", "fr"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                const next = normalizeLang(code);
                persistLang(next);
                setLang(next);
              }}
              className={`rounded-full px-2.5 py-1 ${
                lang === code
                  ? "bg-[var(--kama-accent)] text-white"
                  : "text-zinc-500"
              }`}
              aria-pressed={lang === code}
            >
              {code === "en" ? "EN" : "FR"}
            </button>
          ))}
        </div>

        {!termsReady ? (
          <LoginSpinner />
        ) : showGate ? (
          <TermsAcceptanceGate
            lang={lang}
            onAccepted={() => setTermsAccepted(true)}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pt-10 lg:pt-0">
            <div className="mb-10 flex justify-center lg:justify-start">
              <BrandLogo href={null} className="h-11 w-auto" priority />
            </div>

            <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-zinc-900 lg:text-left lg:text-3xl">
              {lang === "fr" ? "Connexion ou inscription" : "Log in or sign up"}
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500 lg:text-left">
              {lang === "fr"
                ? "Un compte pour réserver, sauvegarder, messager les hôtes et publier votre bien."
                : "One account for booking stays, saving favorites, messaging hosts, and listing your property."}
            </p>

            {sessionWaitTimedOut && status === "loading" ? (
              <div
                className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                Sign-in check is taking longer than usual. You can still continue
                with Google below.
              </div>
            ) : null}

            {error ? (
              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                Sign-in failed. Please try again.
              </div>
            ) : null}

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  signIn("google", { callbackUrl });
                }}
                disabled={loading}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white text-[15px] font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                ) : (
                  <GoogleIcon />
                )}
                {loading
                  ? lang === "fr"
                    ? "Connexion…"
                    : "Connecting…"
                  : lang === "fr"
                    ? "Continuer avec Google"
                    : "Continue with Google"}
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-zinc-50 px-3 text-zinc-400">
                  {lang === "fr" ? "ou" : "or"}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="flex h-[52px] w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-[15px] font-medium text-zinc-700 transition hover:bg-zinc-200/80"
            >
              {lang === "fr"
                ? "Parcourir sans se connecter"
                : "Browse without signing in"}
            </Link>

            <p className="mt-8 text-center text-xs leading-relaxed text-zinc-400 lg:text-left">
              {lang === "fr" ? (
                <>
                  En continuant, vous confirmez avoir accepté les{" "}
                  <Link
                    href={`/policies/terms?lang=fr`}
                    className="underline underline-offset-2 hover:text-zinc-600"
                  >
                    Conditions
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href={`/policies/privacy?lang=fr`}
                    className="underline underline-offset-2 hover:text-zinc-600"
                  >
                    Confidentialité
                  </Link>
                  . Un compte est créé automatiquement si vous êtes nouveau.
                </>
              ) : (
                <>
                  By continuing, you confirm you accepted Kama Properties&apos;{" "}
                  <Link
                    href="/policies/terms?lang=en"
                    className="underline underline-offset-2 hover:text-zinc-600"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/policies/privacy?lang=en"
                    className="underline underline-offset-2 hover:text-zinc-600"
                  >
                    Privacy Policy
                  </Link>
                  . We&apos;ll create an account automatically if you&apos;re
                  new.
                </>
              )}
            </p>
          </div>
        )}

        {/* Mobile hero strip */}
        <div className="relative mt-8 h-32 overflow-hidden rounded-2xl lg:hidden">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,26,26,0.85)] to-[rgba(27,92,87,0.2)]" />
          <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white/90">
            Made for Africans, by Africans.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSpinner />}>
      <LoginContent />
    </Suspense>
  );
}
