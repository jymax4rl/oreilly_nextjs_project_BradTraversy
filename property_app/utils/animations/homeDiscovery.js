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

function clearShellMotionProps(shellEl) {
  if (!shellEl) return;
  // Flip / fade tweens can leave inline opacity/height that hide the map.
  gsap.set(shellEl, {
    clearProps:
      "transform,width,height,maxWidth,padding,borderRadius,boxShadow,margin,opacity",
  });
  const map = shellEl.querySelector("[data-search-shell-map]");
  const widgets = shellEl.querySelector("[data-search-shell-widgets]");
  if (map) {
    gsap.set(map, {
      clearProps: "all",
    });
  }
  if (widgets) {
    gsap.set(widgets, {
      clearProps: "all",
    });
  }
}

function notifyMapContainerResized(shellEl) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("resize"));
  const canvas = shellEl?.querySelector?.(".pem-canvas");
  if (canvas) {
    canvas.dispatchEvent(new Event("pem-container-resize"));
  }
}

/**
 * Capture Flip state before React toggles compact ↔ expanded classes.
 * Shell only — flipping the nested map/widgets left stuck height/opacity
 * after Google Maps mounted into a collapsing panel.
 */
export function captureSearchShellFlipState(shellEl) {
  ensureGsapPlugins();
  if (!shellEl || prefersReducedMotion()) return null;
  return Flip.getState(shellEl, {
    props: "borderRadius,padding,width,maxWidth,height,boxShadow",
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
    clearShellMotionProps(shellEl);
    // Double rAF so layout settles before Maps measures the canvas.
    requestAnimationFrame(() => {
      notifyMapContainerResized(shellEl);
      requestAnimationFrame(() => notifyMapContainerResized(shellEl));
    });
    onComplete?.();
  };

  if (prefersReducedMotion() || !flipState) {
    clearShellMotionProps(shellEl);
    finish();
    return () => {};
  }

  const map = shellEl.querySelector("[data-search-shell-map]");
  const widgets = shellEl.querySelector("[data-search-shell-widgets]");
  // Ensure we never inherit a leftover opacity:0 from a prior submit fade.
  if (map) gsap.set(map, { opacity: 1, y: 0, clearProps: "transform" });
  if (widgets) gsap.set(widgets, { opacity: 1, y: 0, clearProps: "transform" });

  const tween = Flip.from(flipState, {
    duration: 0.55,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: finish,
  });

  if (widgets) {
    gsap.fromTo(
      widgets,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.36, delay: 0.14, ease: "power2.out" },
    );
  }

  return () => {
    tween.kill();
    clearShellMotionProps(shellEl);
  };
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

  const finish = () => {
    clearShellMotionProps(shellEl);
    onComplete?.();
  };

  if (prefersReducedMotion() || !flipState) {
    finish();
    return () => {};
  }

  const tween = Flip.from(flipState, {
    duration: 0.48,
    ease: "power2.inOut",
    absolute: false,
    nested: true,
    onComplete: finish,
  });

  return () => {
    tween.kill();
    clearShellMotionProps(shellEl);
  };
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
