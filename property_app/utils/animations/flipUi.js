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

/** Bounding box for card→modal morph (safer than Flip absolute across IDs). */
export function captureElementRect(el) {
  if (!el || typeof el.getBoundingClientRect !== "function") return null;
  if (prefersReducedMotion()) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  let borderRadius = "1.25rem";
  try {
    borderRadius = getComputedStyle(el).borderRadius || borderRadius;
  } catch {
    /* ignore */
  }
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    borderRadius,
  };
}

/**
 * Play Flip after the destination layout is in the DOM (useLayoutEffect).
 * Prefer for same-element shell morphs — not card→portal modal.
 */
export function runFlipFrom({
  flipState,
  duration = 0.55,
  ease = "power2.inOut",
  absolute = false,
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
    clearProps: "transform",
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

function settleVisible(nodes) {
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  gsap.set(list, { clearProps: "opacity,transform,transformOrigin" });
  gsap.set(list, { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1 });
}

/**
 * Card → modal morph using FLIP math on the panel (no absolute positioning
 * on the card). sourceRect comes from captureElementRect(cardMedia).
 */
export function runModalMorphOpen({
  sourceRect,
  panelEl,
  backdropEl,
  bodyEl,
  chromeEls = [],
  onComplete,
} = {}) {
  ensureGsapPlugins();

  const reveal = [bodyEl, ...chromeEls].filter(Boolean);

  const finish = (callComplete = true) => {
    if (backdropEl) gsap.set(backdropEl, { opacity: 1 });
    settleVisible([panelEl, ...reveal]);
    if (callComplete) onComplete?.();
  };

  if (prefersReducedMotion()) {
    finish(true);
    return () => {};
  }

  const tl = gsap.timeline({
    onComplete: () => finish(true),
  });

  if (backdropEl) {
    gsap.set(backdropEl, { opacity: 0 });
    tl.to(
      backdropEl,
      { opacity: 1, duration: 0.42, ease: "power2.out" },
      0,
    );
  }

  if (panelEl) {
    const final = panelEl.getBoundingClientRect();
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;

    if (sourceRect && final.width > 0 && final.height > 0) {
      const dx = sourceRect.left - final.left;
      const dy = sourceRect.top - final.top;
      const sx = Math.min(1, Math.max(0.28, sourceRect.width / final.width));
      const sy = Math.min(1, Math.max(0.22, sourceRect.height / final.height));

      gsap.set(panelEl, {
        x: dx,
        y: dy,
        scaleX: sx,
        scaleY: sy,
        transformOrigin: "0% 0%",
        opacity: 1,
        borderRadius: sourceRect.borderRadius || "1.35rem",
      });

      tl.to(
        panelEl,
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          borderRadius: mobile ? "1.45rem 1.45rem 0 0" : "1.35rem",
          duration: 0.7,
          ease: "power3.inOut",
        },
        0,
      );
    } else {
      gsap.set(panelEl, {
        y: mobile ? 64 : 32,
        scale: mobile ? 0.96 : 0.94,
        transformOrigin: mobile ? "50% 100%" : "50% 50%",
        opacity: 1,
      });
      tl.to(
        panelEl,
        {
          y: 0,
          scale: 1,
          duration: 0.62,
          ease: "power3.inOut",
        },
        0,
      );
    }
  }

  if (reveal.length) {
    gsap.set(reveal, { opacity: 0, y: 14 });
    tl.to(
      reveal,
      {
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: "power2.out",
        stagger: 0.04,
      },
      0.32,
    );
  }

  return () => {
    tl.kill();
    // Never leave the modal invisible if the tween is interrupted
    finish(false);
  };
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
      tl.to(
        fade,
        {
          opacity: 0,
          y: 10,
          duration: 0.16,
          ease: "power1.in",
          stagger: 0.02,
        },
        0,
      );
    }
    if (panelEl) {
      const mobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches;
      tl.to(
        panelEl,
        {
          y: mobile ? 48 : 20,
          scale: 0.97,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          transformOrigin: mobile ? "50% 100%" : "50% 50%",
        },
        0.04,
      );
    }
    if (backdropEl) {
      tl.to(
        backdropEl,
        { opacity: 0, duration: 0.26, ease: "power1.in" },
        0.06,
      );
    }
  });
}
