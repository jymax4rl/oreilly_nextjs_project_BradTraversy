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

function heroTarget(heroEl) {
  return heroEl?.querySelector?.(".home-hero--photo") || heroEl;
}

function searchFlipTarget(searchEl) {
  return searchEl?.querySelector?.("[data-home-search-card]") || searchEl;
}

/**
 * Hero → results state transition.
 * Compresses hero, Flips search shell, reveals discovery pane.
 */
export function runHomeDiscoverTransition({
  heroEl,
  searchEl,
  teaserEl,
  resultsEl,
  onComplete,
}) {
  ensureGsapPlugins();
  const reduce = prefersReducedMotion();
  const hero = heroTarget(heroEl);
  const searchCard = searchFlipTarget(searchEl);

  if (reduce) {
    heroEl?.classList.add("home-hero--compressed");
    hero?.classList.add("home-hero--compressed");
    searchEl?.classList.add("home-search-morph--compact");
    if (teaserEl) teaserEl.style.display = "none";
    if (resultsEl) {
      resultsEl.style.display = "";
      resultsEl.style.opacity = "1";
    }
    onComplete?.();
    return () => {};
  }

  const flipState = searchCard ? Flip.getState(searchCard) : null;

  heroEl?.classList.add("home-hero--compressed");
  hero?.classList.add("home-hero--compressed");
  searchEl?.classList.add("home-search-morph--compact");
  if (teaserEl) teaserEl.style.display = "none";
  if (resultsEl) {
    resultsEl.style.display = "";
    gsap.set(resultsEl, { opacity: 0, y: 16 });
  }

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => onComplete?.(),
  });

  if (hero) {
    const fades = hero.querySelectorAll("[data-hero-fade]");
    if (fades.length) {
      tl.to(
        fades,
        { opacity: 0.28, y: -6, duration: 0.45, stagger: 0.03 },
        0,
      );
    }
    const cities = hero.querySelector(".home-hero-cities");
    if (cities) {
      tl.to(cities, { opacity: 0, duration: 0.35 }, 0);
    }
  }

  if (flipState && searchCard) {
    tl.add(
      Flip.from(flipState, {
        duration: 0.65,
        ease: "power2.inOut",
        absolute: false,
        nested: true,
        scale: false,
        props: "borderRadius,padding,width,maxWidth",
      }),
      0.04,
    );
  }

  if (resultsEl) {
    tl.to(resultsEl, { opacity: 1, y: 0, duration: 0.5 }, 0.26);

    const mapPane = resultsEl.querySelector("[data-discovery-map]");
    if (mapPane) {
      gsap.set(mapPane, { opacity: 0, x: 24 });
      tl.to(
        mapPane,
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
        0.34,
      );
    }

    const cards = resultsEl.querySelectorAll("[data-discovery-card]");
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
        0.38,
      );
    }
  }

  return () => {
    tl.kill();
  };
}

export function runHomeResetTransition({
  heroEl,
  searchEl,
  teaserEl,
  resultsEl,
  onComplete,
}) {
  ensureGsapPlugins();
  const reduce = prefersReducedMotion();
  const hero = heroTarget(heroEl);
  const searchCard = searchFlipTarget(searchEl);

  if (reduce) {
    heroEl?.classList.remove("home-hero--compressed");
    hero?.classList.remove("home-hero--compressed");
    searchEl?.classList.remove("home-search-morph--compact");
    if (resultsEl) resultsEl.style.display = "none";
    if (teaserEl) teaserEl.style.display = "";
    const fades = hero?.querySelectorAll("[data-hero-fade]");
    fades?.forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
    const cities = hero?.querySelector(".home-hero-cities");
    if (cities) cities.style.opacity = "";
    onComplete?.();
    return () => {};
  }

  const flipState = searchCard ? Flip.getState(searchCard) : null;
  const tl = gsap.timeline({
    onComplete: () => onComplete?.(),
  });

  if (resultsEl) {
    tl.to(resultsEl, { opacity: 0, y: 10, duration: 0.28 }, 0);
  }

  tl.add(() => {
    heroEl?.classList.remove("home-hero--compressed");
    hero?.classList.remove("home-hero--compressed");
    searchEl?.classList.remove("home-search-morph--compact");
    if (resultsEl) resultsEl.style.display = "none";
    if (teaserEl) teaserEl.style.display = "";
    const fades = hero?.querySelectorAll("[data-hero-fade]");
    if (fades?.length) {
      gsap.set(fades, { clearProps: "opacity,transform" });
    }
    const cities = hero?.querySelector(".home-hero-cities");
    if (cities) gsap.set(cities, { clearProps: "opacity" });
  });

  if (flipState && searchCard) {
    tl.add(
      Flip.from(flipState, {
        duration: 0.55,
        ease: "power2.inOut",
        props: "borderRadius,padding,width,maxWidth",
      }),
      "+=0",
    );
  }

  return () => tl.kill();
}
