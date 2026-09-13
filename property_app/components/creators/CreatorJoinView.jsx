"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { toUserFacingError } from "@/utils/userFacingError";

export default function CreatorJoinView({ token, preview }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoTried, setAutoTried] = useState(false);

  const callbackPath = `/creators/join/${token}`;

  async function claim() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/creators/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not open console");
      router.replace("/creators/console");
      router.refresh();
    } catch (err) {
      setError(toUserFacingError(err));
      setBusy(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user || autoTried) return;
    setAutoTried(true);
    claim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user, autoTried]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6 shadow-[0_24px_60px_-40px_rgba(27,92,87,0.55)] sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
          <Megaphone className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--kama-accent)]">
          Creator invite
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          {preview?.name
            ? `Join as ${preview.name}`
            : "Open your creator console"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Sign in with Google to see every promo code hosts assigned to you,
          track attributed stays, and check which nights are still available to
          promote on your stories.
        </p>

        {preview?.codes?.length ? (
          <ul className="mt-4 space-y-2 rounded-2xl bg-[var(--kama-field)] p-3">
            {preview.codes.slice(0, 4).map((c) => (
              <li
                key={c.code}
                className="flex justify-between gap-2 text-sm text-[var(--kama-ink)]"
              >
                <span className="font-mono font-semibold text-[var(--kama-accent)]">
                  {c.code}
                </span>
                <span className="truncate text-[var(--kama-ink-muted)]">
                  {c.propertyName || "Listing"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 space-y-2">
          {status === "authenticated" && session?.user ? (
            <button
              type="button"
              disabled={busy}
              onClick={claim}
              className="w-full rounded-full bg-[var(--kama-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:opacity-60"
            >
              {busy ? "Opening console…" : "Open my creator console"}
            </button>
          ) : (
            <button
              type="button"
              disabled={status === "loading"}
              onClick={() => signIn("google", { callbackUrl: callbackPath })}
              className="w-full rounded-full bg-[var(--kama-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:opacity-60"
            >
              Sign in with Google to continue
            </button>
          )}
          <p className="text-center text-[11px] text-[var(--kama-ink-muted)]">
            Same Isisel Google account you use for bookings. Hosts never see your
            password.
          </p>
        </div>
      </div>
    </main>
  );
}
