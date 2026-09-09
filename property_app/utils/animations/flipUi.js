import gsap from "gsap";
import { Flip } from "gsap/Flip";

let pluginsRegistered = false;

export function ensureGsapPlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(Flip);
  pluginsRegistered = true;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Capture layout before React commits the next UI state.
 * Call from pointer handlers / before setState.
 */
export function captureFlipState(targets, props = "borderRadius,width,height") {
  ensureGsapPlugins();
  if (!targets || prefersReducedMotion()) return null;
  return Flip.getState(targets, { props });
}

/**
 * Play Flip after the destination layout is in the DOM (useLayoutEffect).
 */
export function runFlipFrom({
  flipState,
  duration = 0.55,
  ease = "power2.inOut",
  absolute = true,
  nested = false,
  onComplete,
} = {}) {
  ensureGsapPlugins();
  if (!flipState || prefersReducedMotion()) {
    onComplete?.();
    return () => {};
  }

  const tween = Flip.from(flipState, {
    duration,
    ease,
    absolute,
    nested,
    onComplete: () => onComplete?.(),
  });

  return () => tween.kill();
}

/**
 * Soft fade for modal chrome after the shared-element Flip.
 */
export function fadeInUi(targets, { delay = 0.12, duration = 0.35 } = {}) {
  ensureGsapPlugins();
  const nodes = Array.isArray(targets) ? targets.filter(Boolean) : [targets].filter(Boolean);
  if (!nodes.length) return () => {};
  if (prefersReducedMotion()) {
    gsap.set(nodes, { clearProps: "opacity,transform" });
    return () => {};
  }
  const tween = gsap.fromTo(
    nodes,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration, delay, ease: "power2.out", stagger: 0.04 },
  );
  return () => tween.kill();
}

export function fadeOutUi(targets, { duration = 0.18 } = {}) {
  ensureGsapPlugins();
  const nodes = Array.isArray(targets) ? targets.filter(Boolean) : [targets].filter(Boolean);
  if (!nodes.length) return Promise.resolve();
  if (prefersReducedMotion()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    gsap.to(nodes, {
      opacity: 0,
      y: 6,
      duration,
      ease: "power1.in",
      stagger: 0.02,
      onComplete: resolve,
    });
  });
}
