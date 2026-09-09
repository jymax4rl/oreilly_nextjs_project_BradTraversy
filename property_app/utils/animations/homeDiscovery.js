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
 * Capture Flip state before React toggles compact ↔ expanded classes.
 */
export function captureSearchShellFlipState(shellEl) {
  ensureGsapPlugins();
  if (!shellEl || prefersReducedMotion()) return null;
  return Flip.getState(shellEl, {
    props: "borderRadius,padding,width,maxWidth,height",
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

  if (prefersReducedMotion() || !flipState) {
    const map = shellEl.querySelector("[data-search-shell-map]");
    const widgets = shellEl.querySelector("[data-search-shell-widgets]");
    if (map) gsap.set(map, { clearProps: "opacity,transform" });
    if (widgets) gsap.set(widgets, { clearProps: "opacity,transform" });
    onComplete?.();
    return () => {};
  }

  const tween = Flip.from(flipState, {
    duration: 0.55,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: () => onComplete?.(),
  });

  const map = shellEl.querySelector("[data-search-shell-map]");
  const widgets = shellEl.querySelector("[data-search-shell-widgets]");
  if (map) {
    gsap.fromTo(
      map,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.42, delay: 0.1, ease: "power2.out" },
    );
  }
  if (widgets) {
    gsap.fromTo(
      widgets,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.36, delay: 0.16, ease: "power2.out" },
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
    duration: 0.48,
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
