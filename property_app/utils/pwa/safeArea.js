/**
 * Keep chrome below the status bar / Dynamic Island when the OS paints over
 * the webview (installed PWA with viewport-fit=cover, or Safari).
 *
 * Critical: never clobber the CSS `env(safe-area-inset-*)` defaults with `0px`
 * when the JS probe reads 0 — that was hiding content under the notch in
 * Mobile Safari.
 */

function readEnvInset(property) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding-top:env(${property}, 0px);`;
  document.documentElement.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return px;
}

function isStandaloneOrFullscreen() {
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const fullscreen = window.matchMedia?.("(display-mode: fullscreen)")?.matches;
  const iosStandalone = window.navigator.standalone === true;
  return Boolean(standalone || fullscreen || iosStandalone);
}

/**
 * Overlaying status bar: the layout viewport is nearly the full screen
 * (only the home indicator may be missing). Non-overlay PWAs are shorter
 * because the webview already starts below the status bar.
 */
function isEdgeToEdgeViewport() {
  const screenH = window.screen?.height || 0;
  if (!screenH) return false;
  return window.innerHeight >= screenH - 56;
}

/** Coarse iPhone notch / Dynamic Island detection when env() is unavailable. */
function likelyNeedsTopInsetFallback() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (!/iPhone|iPad|iPod/i.test(ua)) return false;
  // Large modern iPhones (Logical CSS px); Dynamic Island models are ≥852 tall.
  const h = Math.max(window.screen?.height || 0, window.innerHeight || 0);
  return h >= 812;
}

export function syncPwaSafeArea() {
  if (typeof document === "undefined") return;

  const envTop = readEnvInset("safe-area-inset-top");
  const envLeft = readEnvInset("safe-area-inset-left");
  const envRight = readEnvInset("safe-area-inset-right");
  const envBottom = readEnvInset("safe-area-inset-bottom");

  const overlayWithoutInset =
    isStandaloneOrFullscreen() && envTop < 20 && isEdgeToEdgeViewport();

  const browserNotchWithoutInset =
    !isStandaloneOrFullscreen() &&
    envTop < 20 &&
    likelyNeedsTopInsetFallback() &&
    isEdgeToEdgeViewport();

  const root = document.documentElement;

  if (overlayWithoutInset || browserNotchWithoutInset) {
    // Status bar overlays the webview but env() reported 0.
    root.style.setProperty("--kama-safe-top", "54px");
  } else if (envTop > 0) {
    root.style.setProperty("--kama-safe-top", `${envTop}px`);
  } else {
    // Keep stylesheet default: env(safe-area-inset-top) — do not write 0px.
    root.style.removeProperty("--kama-safe-top");
  }

  if (envLeft > 0) {
    root.style.setProperty("--kama-safe-left", `${envLeft}px`);
  } else {
    root.style.removeProperty("--kama-safe-left");
  }

  if (envRight > 0) {
    root.style.setProperty("--kama-safe-right", `${envRight}px`);
  } else {
    root.style.removeProperty("--kama-safe-right");
  }

  if (envBottom > 0) {
    root.style.setProperty("--kama-safe-bottom", `${envBottom}px`);
  } else {
    root.style.removeProperty("--kama-safe-bottom");
  }
}

export function startPwaSafeAreaSync() {
  syncPwaSafeArea();
  window.addEventListener("resize", syncPwaSafeArea);
  window.addEventListener("orientationchange", syncPwaSafeArea);
  window.visualViewport?.addEventListener("resize", syncPwaSafeArea);
  return () => {
    window.removeEventListener("resize", syncPwaSafeArea);
    window.removeEventListener("orientationchange", syncPwaSafeArea);
    window.visualViewport?.removeEventListener("resize", syncPwaSafeArea);
  };
}
