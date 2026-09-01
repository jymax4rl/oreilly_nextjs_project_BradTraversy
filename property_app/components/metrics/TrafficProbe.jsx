"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "kama-traffic-sid";
const HEARTBEAT_MS = 5 * 60 * 1000;

function skipPath(pathname) {
  if (!pathname) return true;
  return (
    pathname.startsWith("/ops") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login")
  );
}

function readSid() {
  try {
    let sid = localStorage.getItem(STORAGE_KEY);
    if (!sid && typeof crypto !== "undefined" && crypto.randomUUID) {
      sid = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

function postHit(sid, kind) {
  fetch("/api/metrics/hit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sid, kind }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Privacy-light traffic probe: one stable anonymous id per browser, a view
 * on each client navigation, and a 5-minute heartbeat while the tab is visible.
 */
export default function TrafficProbe() {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (skipPath(pathname)) return undefined;
    const sid = readSid();
    if (!sid) return undefined;

    postHit(sid, "view");

    const beat = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      postHit(sid, "heartbeat");
    };
    const timer = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => {
      if (!document.hidden) beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
