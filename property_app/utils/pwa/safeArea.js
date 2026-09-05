/**
 * Keep installed-PWA chrome below the status bar only when the OS is
 * actually painting over the webview. When the inset is 0 (in-browser,
 * or a PWA whose webview already starts below the icons), leave padding
 * at 0 so the bar stays flush like a native nav.
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

export function syncPwaSafeArea() {
  if (typeof document === "undefined") return;

  const envTop = readEnvInset("safe-area-inset-top");
  const envLeft = readEnvInset("safe-area-inset-left");
  const envRight = readEnvInset("safe-area-inset-right");

  const overlayWithoutInset =
    isStandaloneOrFullscreen() && envTop < 20 && isEdgeToEdgeViewport();

  const top = overlayWithoutInset ? 54 : envTop;
  const root = document.documentElement;
  root.style.setProperty("--kama-safe-top", `${top}px`);
  root.style.setProperty("--kama-safe-left", `${envLeft}px`);
  root.style.setProperty("--kama-safe-right", `${envRight}px`);
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
