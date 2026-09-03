"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (typeof navigator !== "undefined" && navigator.standalone === true) {
    return true;
  }
  return false;
}

function detectPlatform() {
  if (typeof navigator === "undefined") {
    return {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChromium: false,
    };
  }

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSafari =
    isIOS &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome|Chromium/i.test(ua);
  const isChromium = /Chrome|Chromium|Edg|SamsungBrowser/i.test(ua) && !isIOS;

  return { isIOS, isAndroid, isSafari, isChromium };
}

const SERVER_PLATFORM = {
  isIOS: false,
  isAndroid: false,
  isSafari: false,
  isChromium: false,
};

function subscribeStandalone(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(display-mode: standalone)");
  const onInstalled = () => onStoreChange();
  mq.addEventListener?.("change", onStoreChange);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    mq.removeEventListener?.("change", onStoreChange);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

/**
 * Hybrid PWA install: Chromium one-tap when available; iOS needs manual A2HS.
 */
export default function usePwaInstall() {
  const platform = useSyncExternalStore(
    () => () => {},
    detectPlatform,
    () => SERVER_PLATFORM,
  );
  const installed = useSyncExternalStore(
    subscribeStandalone,
    isStandaloneDisplay,
    () => false,
  );
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installError, setInstallError] = useState("");
  const [acceptedInstall, setAcceptedInstall] = useState(false);

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const effectivelyInstalled = installed || acceptedInstall;
  const canOneTapInstall = Boolean(deferredPrompt) && !effectivelyInstalled;

  const promptInstall = useCallback(async () => {
    setInstallError("");
    if (!deferredPrompt) {
      setInstallError("Install is not available in this browser yet.");
      return { outcome: "unavailable" };
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice?.outcome === "accepted") {
        setAcceptedInstall(true);
      }
      return choice || { outcome: "dismissed" };
    } catch (err) {
      setInstallError(err?.message || "Could not open the install dialog.");
      return { outcome: "error" };
    }
  }, [deferredPrompt]);

  return {
    ready,
    installed: effectivelyInstalled,
    platform,
    canOneTapInstall,
    promptInstall,
    installError,
    needsIosGuide: ready && !effectivelyInstalled && platform.isIOS,
    needsAndroidHint:
      ready &&
      !effectivelyInstalled &&
      !platform.isIOS &&
      (platform.isAndroid || platform.isChromium) &&
      !deferredPrompt,
  };
}
