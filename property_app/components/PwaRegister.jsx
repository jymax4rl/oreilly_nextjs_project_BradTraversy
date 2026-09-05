"use client";

import { useEffect } from "react";
import { startPwaSafeAreaSync } from "@/utils/pwa/safeArea";

/**
 * Registers the PWA service worker and keeps top chrome clear of the
 * status bar only when the installed app is actually drawing under it.
 */
export default function PwaRegister() {
  useEffect(() => startPwaSafeAreaSync(), []);

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
