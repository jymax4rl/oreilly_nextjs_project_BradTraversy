"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "kama_chunk_reload";

function isChunkLoadError(error) {
  if (!error) return false;
  const msg = String(error.message || error);
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk [\w.-]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

/**
 * Segment error UI (replaces page children; layout/nav stay mounted).
 * Auto-reloads once on deploy/chunk skew; otherwise surfaces a clean recovery UI
 * and logs the real exception for DevTools.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[Kama error boundary]", error?.name, error?.message, error);

    if (typeof window === "undefined") return;
    if (!isChunkLoadError(error)) return;

    try {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
      }
    } catch {
      // ignore storage failures
    }
  }, [error]);

  function hardReload() {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Something went wrong
      </h2>
      <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-zinc-600">
        The page hit an unexpected error. Try again — if you just deployed, a
        hard refresh may be needed to load the latest version.
      </p>
      {process.env.NODE_ENV === "development" && error?.message ? (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-zinc-100 p-3 text-left text-xs text-red-700">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={hardReload}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
