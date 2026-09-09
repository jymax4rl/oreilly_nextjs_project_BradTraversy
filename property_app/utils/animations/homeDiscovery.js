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

function shellFlipTargets(shellEl) {
  if (!shellEl) return [];
  const map = shellEl.querySelector("[data-search-shell-map]");
  const widgets = shellEl.querySelector("[data-search-shell-widgets]");
  return [shellEl, map, widgets].filter(Boolean);
}

function notifyMapContainerResized(shellEl) {
  if (typeof window === "undefined") return;
  // Google Maps only reflows when the canvas size changes — nudge after Flip.
  window.dispatchEvent(new Event("resize"));
  const canvas = shellEl?.querySelector?.(".pem-canvas");
  if (canvas) {
    canvas.dispatchEvent(new Event("pem-container-resize"));
  }
}

/**
 * Capture Flip state before React toggles compact ↔ expanded classes.
 * Includes the map node so height/width morph with the shell (map-dominant layout).
 */
export function captureSearchShellFlipState(shellEl) {
  ensureGsapPlugins();
  if (!shellEl || prefersReducedMotion()) return null;
  const targets = shellFlipTargets(shellEl);
  if (!targets.length) return null;
  return Flip.getState(targets, {
    props: "borderRadius,padding,width,maxWidth,height,margin,boxShadow",
  });
}

/**
 * Animate after React has applied the expanded shell classes.
 */
export function runSearchShellExpand({ shellEl, flipState, onComplete }) {
  ensureGsapPlugins();
  if (!shellEl) {
    onComplete?.();
    return () => {};
  }

  const finish = () => {
    notifyMapContainerResized(shellEl);
    onComplete?.();
  };

  if (prefersReducedMotion() || !flipState) {
    const map = shellEl.querySelector("[data-search-shell-map]");
    const widgets = shellEl.querySelector("[data-search-shell-widgets]");
    if (map) gsap.set(map, { clearProps: "opacity,transform" });
    if (widgets) gsap.set(widgets, { clearProps: "opacity,transform" });
    finish();
    return () => {};
  }

  const tween = Flip.from(flipState, {
    duration: 0.58,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: finish,
  });

  const map = shellEl.querySelector("[data-search-shell-map]");
  const widgets = shellEl.querySelector("[data-search-shell-widgets]");
  if (map) {
    gsap.fromTo(
      map,
      { opacity: 0.35 },
      { opacity: 1, duration: 0.4, delay: 0.06, ease: "power2.out" },
    );
  }
  if (widgets) {
    gsap.fromTo(
      widgets,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, delay: 0.18, ease: "power2.out" },
    );
  }

  return () => tween.kill();
}

/**
 * Animate after React has applied the compact pill classes.
 */
export function runSearchShellCollapse({ shellEl, flipState, onComplete }) {
  ensureGsapPlugins();
  if (!shellEl) {
    onComplete?.();
    return () => {};
  }

  if (prefersReducedMotion() || !flipState) {
    onComplete?.();
    return () => {};
  }

  const tween = Flip.from(flipState, {
    duration: 0.5,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: () => onComplete?.(),
  });

  return () => tween.kill();
}

/** @deprecated aliases */
export function runSearchExpandTransition({ cardEl, onComplete }) {
  return runSearchShellExpand({ shellEl: cardEl, flipState: null, onComplete });
}

export function runSearchCollapseTransition({ cardEl, onComplete }) {
  return runSearchShellCollapse({ shellEl: cardEl, flipState: null, onComplete });
}

export function runDiscoveryResultsEnter({ listEl, onComplete }) {
  ensureGsapPlugins();
  if (prefersReducedMotion()) {
    if (listEl) gsap.set(listEl, { clearProps: "opacity,transform" });
    onComplete?.();
    return () => {};
  }

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => onComplete?.(),
  });

  if (listEl) {
    tl.fromTo(
      listEl,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4 },
      0,
    );
    const cards = listEl.querySelectorAll("[data-discovery-card]");
    if (cards.length) {
      gsap.set(cards, { opacity: 0, y: 10 });
      tl.to(
        cards,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
        },
        0.1,
      );
    }
  }

  return () => tl.kill();
}

export function runHomeDiscoverTransition(opts) {
  return runDiscoveryResultsEnter({
    listEl: opts?.resultsEl?.querySelector?.("[data-home-discovery-list]"),
    onComplete: opts?.onComplete,
  });
}

export function runHomeResetTransition({ onComplete }) {
  onComplete?.();
  return () => {};
}
