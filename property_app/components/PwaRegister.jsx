"use client";

import { useEffect } from "react";

/**
 * Registers the minimal service worker required for Chromium PWA installability.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        /* ignore — iOS guide still works without SW */
      }
    };

    register();
  }, []);

  return null;
}
