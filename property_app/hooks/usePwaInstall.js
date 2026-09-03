"use client";

import { useCallback, useEffect, useState } from "react";

const SERVER_PLATFORM = Object.freeze({
  isIOS: false,
  isAndroid: false,
  isSafari: false,
  isChromium: false,
});

function readStandalone() {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  } catch {
    /* older WebViews */
  }
  return typeof navigator !== "undefined" && navigator.standalone === true;
}

function readPlatform() {
  if (typeof navigator === "undefined") return SERVER_PLATFORM;
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
  return Object.freeze({ isIOS, isAndroid, isSafari, isChromium });
}

function subscribeStandalone(onChange) {
  if (typeof window === "undefined") return () => {};

  const onInstalled = () => onChange();
  let mq;
  try {
    mq = window.matchMedia("(display-mode: standalone)");
  } catch {
    mq = null;
  }

  if (mq) {
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onChange);
    }
  }
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    if (mq) {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onChange);
      } else if (typeof mq.removeListener === "function") {
        mq.removeListener(onChange);
      }
    }
    window.removeEventListener("appinstalled", onInstalled);
  };
}

/**
 * Hybrid PWA install: Chromium one-tap when available; iOS needs manual A2HS.
 * Platform/installed are set after mount so iOS Safari never hydration-loops.
 */
export default function usePwaInstall() {
  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState(SERVER_PLATFORM);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installError, setInstallError] = useState("");
  const [acceptedInstall, setAcceptedInstall] = useState(false);

  useEffect(() => {
    setPlatform(readPlatform());
    setInstalled(readStandalone());
    setReady(true);
    return subscribeStandalone(() => setInstalled(readStandalone()));
  }, []);

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
