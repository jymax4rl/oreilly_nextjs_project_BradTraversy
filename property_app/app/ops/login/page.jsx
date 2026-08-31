"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";
import { isOpsStaff } from "@/utils/opsAuth";

function OpsLoginSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--kama-canvas)]">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

function OpsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hostLabel, setHostLabel] = useState("www.isisel.com");
  const [bootstrap, setBootstrap] = useState({
    loading: true,
    needsBootstrap: false,
    emailLocked: false,
  });

  const callbackUrl = searchParams.get("callbackUrl") || "/ops";
  const opsDestination = callbackUrl.startsWith("/ops") ? callbackUrl : "/ops";

  useEffect(() => {
    setHostLabel(window.location.host);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ops/founder-status", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const needsBootstrap = !!data?.needsBootstrap;
        setBootstrap({
          loading: false,
          needsBootstrap,
          emailLocked: !!data?.emailLocked,
        });
        if (data?.founderEmail) {
          setEmail(String(data.founderEmail));
        }
      } catch {
        if (!cancelled) {
          setBootstrap({
            loading: false,
            needsBootstrap: false,
            emailLocked: false,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isOpsStaff(session?.user?.role)) {
      router.replace(opsDestination);
    }
  }, [status, session, router, opsDestination]);

  async function applyLoginHint(failedEmail) {
    try {
      const res = await fetch("/api/ops/login-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: failedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.hint) {
        setError(data.hint);
        return;
      }
    } catch {
      /* fall through */
    }
    setError("Invalid credentials or this account is not ops staff.");
  }

  async function onSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const result = await signIn("ops-credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: opsDestination,
      });
      if (result?.error) {
        await applyLoginHint(normalizedEmail);
        setLoading(false);
        return;
      }
      window.location.assign(opsDestination);
    } catch {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  async function onFounderSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const res = await fetch("/api/ops/founder-bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Founder setup failed. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signIn("ops-credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: opsDestination,
      });
      if (result?.error) {
        setError(
          "Founder access was created, but sign-in failed. Try signing in with your new password.",
        );
        setBootstrap({
          loading: false,
          needsBootstrap: false,
          emailLocked: false,
        });
        setLoading(false);
        return;
      }
      window.location.assign(opsDestination);
    } catch {
      setError("Founder setup failed. Please try again.");
      setLoading(false);
    }
  }

  if (status === "loading" || bootstrap.loading) {
    return <OpsLoginSpinner />;
  }

  if (status === "authenticated" && isOpsStaff(session?.user?.role)) {
    return <OpsLoginSpinner />;
  }

  const isFounderMode = bootstrap.needsBootstrap;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--kama-canvas)] lg:flex-row">
      {/* Form — left (Mews-style) */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:max-w-[520px] lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-[380px]">
          <BrandLogo href={null} className="h-9 w-auto" priority />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
            Staff console
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[var(--kama-ink)]">
            {isFounderMode ? "Create founder access" : "Sign in to Operations"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
            {isFounderMode
              ? "No ops password exists yet. Set a strong password for the founding superadmin. This form disappears after the first successful setup."
              : "For Kama Properties administrators. Guest and host accounts use the main site login."}
          </p>

          {error ? (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <form
            className="mt-8 space-y-5"
            onSubmit={isFounderMode ? onFounderSubmit : onSignIn}
          >
            <div>
              <label
                htmlFor="ops-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]"
              >
                Email
              </label>
              <input
                id="ops-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isFounderMode && bootstrap.emailLocked}
                className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] text-[var(--kama-ink)] outline-none transition focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)] read-only:bg-[var(--kama-field)] read-only:text-[var(--kama-ink-muted)]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label
                htmlFor="ops-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]"
              >
                {isFounderMode ? "Choose password" : "Password"}
              </label>
              <input
                id="ops-password"
                name="password"
                type="password"
                autoComplete={
                  isFounderMode ? "new-password" : "current-password"
                }
                required
                minLength={isFounderMode ? 10 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] text-[var(--kama-ink)] outline-none transition focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
                placeholder="••••••••"
              />
            </div>
            {isFounderMode ? (
              <div>
                <label
                  htmlFor="ops-confirm-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]"
                >
                  Confirm password
                </label>
                <input
                  id="ops-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] text-[var(--kama-ink)] outline-none transition focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
                  placeholder="••••••••"
                />
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[#1B5C57] text-[15px] font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isFounderMode
                  ? "Creating access…"
                  : "Signing in…"
                : isFounderMode
                  ? "Create founder access"
                  : "Continue"}
            </button>
          </form>

          <p className="mt-6 rounded-lg border border-[var(--kama-border)] bg-[var(--kama-field)] px-3.5 py-3 text-xs leading-relaxed text-[var(--kama-ink-muted)]">
            Confirm you are on the right host:{" "}
            <span className="font-semibold text-[var(--kama-ink)]">
              {hostLabel}
            </span>
            . Never enter your ops password on a site you do not trust.
          </p>

          <p className="mt-8 text-xs leading-relaxed text-[var(--kama-ink-muted)]">
            <Link
              href="/policies/privacy"
              className="underline underline-offset-2 hover:text-[var(--kama-ink)]"
            >
              Privacy
            </Link>
            {" · "}
            <Link
              href="/policies"
              className="underline underline-offset-2 hover:text-[var(--kama-ink)]"
            >
              Policies
            </Link>
            {" · "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-[var(--kama-ink)]"
            >
              Main site
            </Link>
          </p>
        </div>
      </div>

      {/* Branded panel — right */}
      <aside
        className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between"
        style={{
          background:
            "linear-gradient(160deg, #144844 0%, #1B5C57 42%, #0c1a1a 100%)",
        }}
        aria-hidden={false}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 60%, #fff 0.6px, transparent 0.7px)",
            backgroundSize: "28px 28px, 36px 36px",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              Kama Properties
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-snug tracking-tight xl:text-4xl">
              Operations console for hosts, listings, and payments.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              A calm workspace for staff moderation and marketplace oversight.
              Analytics and deeper tools arrive in later phases.
            </p>
          </div>
          <p className="text-xs text-white/45">
            Authorized personnel only · Phase 1
          </p>
        </div>
      </aside>

      {/* Mobile brand strip */}
      <div
        className="px-6 py-8 text-white lg:hidden"
        style={{
          background: "linear-gradient(160deg, #1B5C57 0%, #0c1a1a 100%)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Kama Properties
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Staff operations for African vacation rentals.
        </p>
      </div>
    </div>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense fallback={<OpsLoginSpinner />}>
      <OpsLoginForm />
    </Suspense>
  );
}
