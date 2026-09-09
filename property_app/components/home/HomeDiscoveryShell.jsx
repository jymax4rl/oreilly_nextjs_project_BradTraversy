"use client";

import { useEffect, useRef } from "react";
import {
  HOME_STAGE,
  emptyHomeFilters,
  useHomeDiscovery,
} from "@/components/home/HomeDiscoveryContext";
import {
  runHomeDiscoverTransition,
  runHomeResetTransition,
} from "@/utils/animations/homeDiscovery";
import PropertyExploreExperience from "@/components/maps/PropertyExploreExperience";

function readFiltersFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const discover = params.get("discover");
  const location = params.get("location") || "";
  const type = params.get("type") || "";
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const minBeds = params.get("minBeds");
  const minBaths = params.get("minBaths");
  const hasQuery =
    discover === "1" ||
    location ||
    type ||
    minPrice ||
    maxPrice ||
    minBeds ||
    minBaths;
  if (!hasQuery) return null;
  return {
    ...emptyHomeFilters(),
    location,
    type: type || "",
    minPrice: minPrice != null && minPrice !== "" ? Number(minPrice) : null,
    maxPrice: maxPrice != null && maxPrice !== "" ? Number(maxPrice) : null,
    minBeds: minBeds || null,
    minBaths: minBaths || null,
  };
}

/**
 * Owns Flip/timeline transitions between homepage hero and discovery results.
 * Keeps GSAP isolated from leaf search/map components.
 */
export default function HomeDiscoveryShell({
  hero,
  search,
  teaser,
  seedProperties = [],
}) {
  const {
    stage,
    filters,
    isResults,
    enterResults,
    resetToHero,
    markTransitionDone,
  } = useHomeDiscovery();

  const heroRef = useRef(null);
  const searchRef = useRef(null);
  const teaserRef = useRef(null);
  const resultsRef = useRef(null);
  const prevStageRef = useRef(stage);
  const cleanupRef = useRef(null);
  const bootedRef = useRef(false);
  const skipAnimRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const fromUrl = readFiltersFromUrl();
    if (!fromUrl) return;
    skipAnimRef.current = true;
    enterResults(fromUrl);
  }, [enterResults]);

  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = stage;
    if (prev === stage) return undefined;

    cleanupRef.current?.();
    cleanupRef.current = null;

    const heroEl = heroRef.current;
    const searchEl = searchRef.current;
    const teaserEl = teaserRef.current;
    const resultsEl = resultsRef.current;
    const hero =
      heroEl?.querySelector?.(".home-hero--photo") || heroEl;

    if (skipAnimRef.current) {
      skipAnimRef.current = false;
      if (stage === HOME_STAGE.RESULTS) {
        heroEl?.classList.add("home-hero--compressed");
        hero?.classList.add("home-hero--compressed");
        searchEl?.classList.add("home-search-morph--compact");
        if (teaserEl) teaserEl.style.display = "none";
        if (resultsEl) {
          resultsEl.style.display = "";
          resultsEl.style.opacity = "1";
        }
      }
      markTransitionDone();
      return undefined;
    }

    const common = {
      heroEl,
      searchEl,
      teaserEl,
      resultsEl,
      onComplete: markTransitionDone,
    };

    if (stage === HOME_STAGE.RESULTS) {
      requestAnimationFrame(() => {
        cleanupRef.current = runHomeDiscoverTransition(common);
      });
    } else {
      requestAnimationFrame(() => {
        cleanupRef.current = runHomeResetTransition(common);
      });
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [stage, markTransitionDone]);

  useEffect(() => {
    if (!isResults) return undefined;
    document.body.classList.add("home-discovery-active");
    return () => document.body.classList.remove("home-discovery-active");
  }, [isResults]);

  useEffect(() => {
    if (!isResults) {
      document.documentElement.style.removeProperty(
        "--home-discovery-chrome-bottom",
      );
      return undefined;
    }

    const measure = () => {
      const heroBottom =
        heroRef.current?.getBoundingClientRect?.().bottom ?? 0;
      const searchBottom =
        searchRef.current?.getBoundingClientRect?.().bottom ?? 0;
      const bottom = Math.max(heroBottom, searchBottom, 0);
      if (bottom > 0) {
        document.documentElement.style.setProperty(
          "--home-discovery-chrome-bottom",
          `${Math.ceil(bottom)}px`,
        );
      }
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const t1 = window.setTimeout(measure, 100);
    const t2 = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty(
        "--home-discovery-chrome-bottom",
      );
    };
  }, [isResults, stage]);

  return (
    <>
      <div ref={heroRef} className="home-discovery-hero-slot">
        {hero}
      </div>

      <div
        ref={searchRef}
        className="home-search-morph"
        data-home-search-morph
      >
        {search}
      </div>

      <div
        ref={teaserRef}
        className="home-discovery-teaser"
        hidden={isResults}
        aria-hidden={isResults}
      >
        {teaser}
      </div>

      <div
        ref={resultsRef}
        className="home-discovery-results"
        data-home-discovery-results
        style={{ display: isResults ? "" : "none" }}
        aria-hidden={!isResults}
      >
        {isResults ? (
          <PropertyExploreExperience
            variant="embedded"
            initialProperties={seedProperties}
            filters={filters}
            listHeader={
              <div className="pem-catalog-chrome flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  {filters.location
                    ? `Stays in ${filters.location}`
                    : "Stays near you"}
                </h2>
                <button
                  type="button"
                  onClick={resetToHero}
                  className="rounded-full border border-[var(--kama-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--kama-ink-muted)] transition hover:border-[var(--kama-border-strong)] hover:text-[var(--kama-accent)]"
                >
                  Back to home
                </button>
              </div>
            }
          />
        ) : null}
      </div>
    </>
  );
}
