"use client";

import { useEffect } from "react";

const RELOAD_KEY = "kama_chunk_reload";

function isChunkLoadError(reason) {
  const message = String(reason?.message || reason || "");
  return (
    reason?.name === "ChunkLoadError" ||
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to load chunk") ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

/**
 * After a deployment, browsers may still reference old JS chunk hashes.
 * Reload once so users pick up the latest build instead of a black error screen.
 */
export default function ChunkErrorRecovery() {
  useEffect(() => {
    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const onError = (event) => {
      if (isChunkLoadError(event.error)) reloadOnce();
    };

    const onUnhandledRejection = (event) => {
      if (isChunkLoadError(event.reason)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
