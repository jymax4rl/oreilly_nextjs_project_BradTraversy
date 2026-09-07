"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CleanerJoinView({ token }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/cleaners/join/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setInvite(json.invite);
      });
  }, [token]);

  const accept = async () => {
    setBusy(true);
    const res = await fetch(`/api/cleaners/join/${token}`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not accept invite");
      return;
    }
    await update?.();
    router.push("/cleaners");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
        Isisel Cleaners
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Join as a cleaner</h1>
      {invite ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          {invite.hostName} invited {invite.name || "you"} to clean their properties.
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--kama-ink-muted)]">Loading invitation…</p>
      )}
      {invite?.status && invite.status !== "pending" ? (
        <p className="mt-4 text-sm text-rose-700">This invitation is {invite.status}.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {status === "loading" ? null : session?.user ? (
        <button
          type="button"
          disabled={busy || invite?.status !== "pending"}
          onClick={accept}
          className="mt-8 w-full rounded-2xl bg-[var(--kama-accent)] py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Joining…" : "Accept and continue"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: `/cleaners/join/${token}` })}
          className="mt-8 w-full rounded-2xl bg-[var(--kama-ink)] py-4 text-base font-semibold text-white"
        >
          Sign in with Google to accept
        </button>
      )}
    </div>
  );
}
