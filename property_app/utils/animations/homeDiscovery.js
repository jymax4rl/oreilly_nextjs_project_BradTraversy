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
 * Expand compact search overlay → full search card (Flip).
 */
export function runSearchExpandTransition({ cardEl, onComplete }) {
  ensureGsapPlugins();
  if (!cardEl) {
    onComplete?.();
    return () => {};
  }

  if (prefersReducedMotion()) {
    cardEl.classList.add("home-search-card--expanded");
    cardEl.classList.remove("home-search-card--compact");
    onComplete?.();
    return () => {};
  }

  const state = Flip.getState(cardEl);
  cardEl.classList.add("home-search-card--expanded");
  cardEl.classList.remove("home-search-card--compact");

  const tween = Flip.from(state, {
    duration: 0.45,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: () => onComplete?.(),
  });

  const panel = cardEl.querySelector("[data-search-expand-panel]");
  if (panel) {
    gsap.fromTo(
      panel,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.32, delay: 0.12, ease: "power2.out" },
    );
  }

  return () => tween.kill();
}

/**
 * Collapse expanded search → compact overlay (Flip).
 */
export function runSearchCollapseTransition({ cardEl, onComplete }) {
  ensureGsapPlugins();
  if (!cardEl) {
    onComplete?.();
    return () => {};
  }

  if (prefersReducedMotion()) {
    cardEl.classList.remove("home-search-card--expanded");
    cardEl.classList.add("home-search-card--compact");
    onComplete?.();
    return () => {};
  }

  const state = Flip.getState(cardEl);
  cardEl.classList.remove("home-search-card--expanded");
  cardEl.classList.add("home-search-card--compact");

  const tween = Flip.from(state, {
    duration: 0.4,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: () => onComplete?.(),
  });

  return () => tween.kill();
}

/**
 * After search submit: subtle map dim recovery + results enter.
 */
export function runDiscoveryResultsEnter({
  mapStageEl,
  listEl,
  onComplete,
}) {
  ensureGsapPlugins();

  if (prefersReducedMotion()) {
    if (mapStageEl) gsap.set(mapStageEl, { clearProps: "opacity,transform" });
    if (listEl) gsap.set(listEl, { clearProps: "opacity,transform" });
    onComplete?.();
    return () => {};
  }

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => onComplete?.(),
  });

  if (mapStageEl) {
    tl.fromTo(
      mapStageEl,
      { scale: 0.985 },
      { scale: 1, duration: 0.45 },
      0,
    );
  }

  if (listEl) {
    tl.fromTo(
      listEl,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.08,
    );

    const cards = listEl.querySelectorAll("[data-discovery-card]");
    if (cards.length) {
      gsap.set(cards, { opacity: 0, y: 10 });
      tl.to(
        cards,
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.035,
          ease: "power2.out",
        },
        0.16,
      );
    }
  }

  return () => tl.kill();
}

/** @deprecated kept for reset paths that still import discover/reset */
export function runHomeDiscoverTransition(opts) {
  return runDiscoveryResultsEnter({
    mapStageEl: opts?.resultsEl?.querySelector?.("[data-home-map-stage]"),
    listEl: opts?.resultsEl?.querySelector?.("[data-home-discovery-list]"),
    onComplete: opts?.onComplete,
  });
}

export function runHomeResetTransition({ onComplete }) {
  onComplete?.();
  return () => {};
}
