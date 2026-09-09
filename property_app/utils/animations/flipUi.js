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
export function captureFlipState(
  targets,
  props = "borderRadius,width,height",
) {
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
  scale = false,
  simple = false,
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
    scale,
    simple,
    onComplete: () => onComplete?.(),
  });

  return () => tween.kill();
}

/**
 * Soft fade for modal chrome after the shared-element Flip.
 */
export function fadeInUi(targets, { delay = 0.12, duration = 0.35 } = {}) {
  ensureGsapPlugins();
  const nodes = Array.isArray(targets)
    ? targets.filter(Boolean)
    : [targets].filter(Boolean);
  if (!nodes.length) return () => {};
  if (prefersReducedMotion()) {
    gsap.set(nodes, { clearProps: "opacity,transform" });
    return () => {};
  }
  const tween = gsap.fromTo(
    nodes,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: "power2.out",
      stagger: 0.04,
    },
  );
  return () => tween.kill();
}

export function fadeOutUi(targets, { duration = 0.18 } = {}) {
  ensureGsapPlugins();
  const nodes = Array.isArray(targets)
    ? targets.filter(Boolean)
    : [targets].filter(Boolean);
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

/**
 * Card → modal morph: Flip shared media + expand the panel as one motion.
 */
export function runModalMorphOpen({
  flipState,
  heroEl,
  panelEl,
  backdropEl,
  bodyEl,
  chromeEls = [],
  onComplete,
} = {}) {
  ensureGsapPlugins();

  if (prefersReducedMotion()) {
    if (backdropEl) gsap.set(backdropEl, { opacity: 1 });
    if (panelEl) gsap.set(panelEl, { clearProps: "transform,opacity" });
    if (bodyEl) gsap.set(bodyEl, { clearProps: "opacity,transform" });
    onComplete?.();
    return () => {};
  }

  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: () => onComplete?.(),
  });

  if (backdropEl) {
    tl.fromTo(
      backdropEl,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: "power2.out" },
      0,
    );
  }

  if (panelEl) {
    const mobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
    tl.fromTo(
      panelEl,
      {
        y: mobile ? 56 : 28,
        scale: mobile ? 0.94 : 0.9,
        opacity: 0.72,
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.68,
        ease: "power3.inOut",
      },
      0,
    );
  }

  if (flipState && heroEl) {
    tl.add(
      Flip.from(flipState, {
        targets: heroEl,
        duration: 0.68,
        ease: "power3.inOut",
        absolute: true,
        scale: true,
        simple: true,
      }),
      0,
    );
  } else if (heroEl) {
    tl.fromTo(
      heroEl,
      { opacity: 0.65, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
      0.05,
    );
  }

  const reveal = [bodyEl, ...chromeEls].filter(Boolean);
  if (reveal.length) {
    tl.fromTo(
      reveal,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.04,
      },
      0.28,
    );
  }

  return () => tl.kill();
}

/**
 * Soft reverse morph when closing the preview modal.
 */
export function runModalMorphClose({
  panelEl,
  backdropEl,
  bodyEl,
  chromeEls = [],
} = {}) {
  ensureGsapPlugins();
  const nodes = [bodyEl, ...chromeEls, panelEl, backdropEl].filter(Boolean);
  if (!nodes.length) return Promise.resolve();
  if (prefersReducedMotion()) return Promise.resolve();

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    const fade = [bodyEl, ...chromeEls].filter(Boolean);
    if (fade.length) {
      tl.to(fade, {
        opacity: 0,
        y: 10,
        duration: 0.16,
        ease: "power1.in",
        stagger: 0.02,
      }, 0);
    }
    if (panelEl) {
      const mobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches;
      tl.to(
        panelEl,
        {
          y: mobile ? 40 : 18,
          scale: 0.96,
          opacity: 0,
          duration: 0.32,
          ease: "power2.in",
        },
        0.04,
      );
    }
    if (backdropEl) {
      tl.to(backdropEl, { opacity: 0, duration: 0.28, ease: "power1.in" }, 0.06);
    }
  });
}
