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
 * Segment error UI. Prefer fixing root throws so this rarely appears.
 * Chunk skew after deploy: one automatic reload. Otherwise log + recover without
 * wiping the shell (layout/nav stay mounted).
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
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-12 text-center">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
        Something went wrong
      </h2>
      <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-zinc-600">
        A client-side error interrupted this view. Your listing data may still be
        fine — try again or reload. Check the browser console for details.
      </p>
      {error?.message ? (
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
