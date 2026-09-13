"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/utils/animations/flipUi";
import "./pwa-boot-reveal.css";

const MIN_HOLD_MS = 720;
const MAX_WAIT_MS = 2800;

function isPwaDisplay() {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const fullscreen = window.matchMedia?.("(display-mode: fullscreen)")?.matches;
  const ios = window.navigator.standalone === true;
  let fromPwaQuery = false;
  try {
    fromPwaQuery =
      new URLSearchParams(window.location.search).get("source") === "pwa";
  } catch {
    /* ignore */
  }
  return Boolean(standalone || fullscreen || ios || fromPwaQuery);
}

function waitFonts(timeoutMs = 1200) {
  if (typeof document === "undefined" || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

function waitNextFrames(count = 2) {
  return new Promise((resolve) => {
    let left = count;
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function clearBoot(root) {
  document.documentElement.classList.remove("pwa-booting");
  document.documentElement.classList.add("pwa-boot-done");
  root?.remove?.();
}

/**
 * PWA cold-start reveal. The early inline script paints the logo veil;
 * this client module waits until the shell is ready, then runs a calm
 * GSAP curtain/logo reveal. No-op in normal browser tabs.
 */
export default function PwaBootReveal() {
  useEffect(() => {
    const early = document.getElementById("pwa-boot-early");

    if (!isPwaDisplay()) {
      early?.remove?.();
      document.documentElement.classList.remove("pwa-booting", "pwa-standalone");
      return undefined;
    }

    document.documentElement.classList.add("pwa-standalone", "pwa-booting");

    // Ensure a veil exists even if the early script was blocked
    let root = early;
    if (!root) {
      root = document.createElement("div");
      root.id = "pwa-boot-early";
      root.className = "pwa-boot";
      root.setAttribute("aria-hidden", "true");
      root.innerHTML =
        '<div class="pwa-boot__veil"><div class="pwa-boot__glow"></div><div class="pwa-boot__mark"><img class="pwa-boot__logo" src="/brand/isisel-logo.svg" alt="" width="168" height="56"/></div><div class="pwa-boot__line-wrap"><span class="pwa-boot__line"></span></div></div>';
      document.body.appendChild(root);
    }

    const mark = root.querySelector(".pwa-boot__mark");
    const veil = root.querySelector(".pwa-boot__veil");
    const glow = root.querySelector(".pwa-boot__glow");
    const line = root.querySelector(".pwa-boot__line");
    const started = performance.now();
    let cancelled = false;
    let breathTween = null;
    let ran = false;

    const reveal = () => {
      if (cancelled || ran) return;
      ran = true;
      breathTween?.kill?.();

      if (prefersReducedMotion() || !mark || !veil) {
        clearBoot(root);
        return;
      }

      const app = document.querySelector("[data-pwa-boot-app]");
      const tl = gsap.timeline({
        onComplete: () => clearBoot(root),
      });

      tl.to(mark, { scale: 1.05, duration: 0.36, ease: "power2.out" }, 0);
      if (glow || line) {
        tl.to(
          [glow, line].filter(Boolean),
          { opacity: 0, duration: 0.26, ease: "power1.in" },
          0.04,
        );
      }
      tl.to(
        mark,
        {
          scale: 0.86,
          y: -22,
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.58,
          ease: "power3.in",
        },
        0.26,
      );
      tl.to(
        veil,
        {
          yPercent: -110,
          duration: 0.9,
          ease: "power4.inOut",
        },
        0.2,
      );

      if (app) {
        tl.fromTo(
          app,
          { opacity: 0.88, y: 14 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
          0.42,
        );
      }
    };

    const arm = async () => {
      await Promise.all([waitFonts(), waitNextFrames(2)]);
      if (cancelled) return;
      const hold = Math.max(0, MIN_HOLD_MS - (performance.now() - started));
      if (hold > 0) {
        await new Promise((r) => window.setTimeout(r, hold));
      }
      if (!cancelled) reveal();
    };

    if (!prefersReducedMotion() && mark) {
      breathTween = gsap.to(mark, {
        scale: 1.025,
        duration: 1.45,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      if (glow) {
        gsap.to(glow, {
          opacity: 0.58,
          duration: 1.45,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0.18, opacity: 0.35 },
          {
            scaleX: 1,
            opacity: 0.9,
            duration: 1.2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
      }
    }

    const maxTimer = window.setTimeout(() => reveal(), MAX_WAIT_MS);
    void arm();

    return () => {
      cancelled = true;
      window.clearTimeout(maxTimer);
      breathTween?.kill?.();
    };
  }, []);

  return null;
}
