"use client";

import { useEffect } from "react";

async function clearHomeScreenBadge() {
  try {
    if (navigator.clearAppBadge) {
      await navigator.clearAppBadge();
    }
  } catch {
    /* ignore */
  }
  try {
    const reg = await navigator.serviceWorker?.ready;
    const notes = (await reg?.getNotifications?.()) || [];
    notes.forEach((n) => n.close());
  } catch {
    /* ignore */
  }
}

/**
 * When the host opens the console, drop the red number on the installed PWA icon.
 */
export default function HostAppBadgeSync() {
  useEffect(() => {
    const clear = () => {
      clearHomeScreenBadge();
      fetch("/api/push/badge", { method: "POST", credentials: "include" }).catch(
        () => {},
      );
    };

    clear();
    const onVisible = () => {
      if (document.visibilityState === "visible") clear();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
