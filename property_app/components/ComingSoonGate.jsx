"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import KamaLogo from "@/assets/images/Kama logo - blue.svg";

function ComingSoonForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/site-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Invalid access code");
        setLoading(false);
        return;
      }

      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <label htmlFor="access-code" className="sr-only">
        Access code
      </label>
      <input
        id="access-code"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Access code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3.5 text-center text-lg tracking-widest text-white placeholder:text-zinc-500 outline-none transition focus:border-[#00C8FF] focus:ring-2 focus:ring-[#00C8FF]/30"
        disabled={loading}
      />

      {error ? (
        <p className="text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full rounded-lg bg-[#00C8FF] px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-zinc-950 transition hover:bg-[#00b8e8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Checking…" : "Enter site"}
      </button>
    </form>
  );
}

export default function ComingSoonGate() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#00C8FF]/30 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-600/25 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <Image
          src={KamaLogo}
          alt="Kama Properties"
          width={180}
          height={170}
          className="mx-auto mb-8 h-auto w-36 select-none"
          priority
        />

        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#00C8FF]">
          Coming soon
        </p>
        <h1 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">
          Kama Properties
        </h1>
        <p className="mb-10 text-base leading-relaxed text-zinc-400">
          African vacation rentals — launching soon. Enter your access code to
          preview the site.
        </p>

        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-lg bg-zinc-800/50" />
          }
        >
          <ComingSoonForm />
        </Suspense>

        <p className="mt-12 text-xs text-zinc-600">
          © {new Date().getFullYear()} Kama Properties
        </p>
      </div>
    </div>
  );
}
