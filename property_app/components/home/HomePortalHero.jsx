"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import HomeHeroBackdrop from "./HomeHeroBackdrop";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Photograph first. Brand sits quietly; a thin line asks you to continue.
 * Search lives in the section below so the UI never fights the image.
 */
export default function HomePortalHero({ catalogOpen = true }) {
  const { t } = useLanguage();
  const rootRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-fade]",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.12,
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  /* Lock mobile hero to the visible phone screen (visual viewport). */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 1023px)");

    const sync = () => {
      if (!mq.matches) {
        root.style.removeProperty("--home-hero-height");
        return;
      }
      const vv = window.visualViewport?.height;
      const layout = window.innerHeight || 0;
      /* Prefer the larger measure so browser chrome collapse never
         leaves a cream strip under the photograph. */
      const height = Math.max(layout, vv || 0, 0);
      if (height > 0) {
        root.style.setProperty("--home-hero-height", `${Math.round(height)}px`);
      }
    };

    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    mq.addEventListener?.("change", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      mq.removeEventListener?.("change", sync);
      root.style.removeProperty("--home-hero-height");
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="home-hero--photo relative isolate flex flex-col items-center justify-end overflow-hidden px-5 sm:px-8 sm:pb-12 lg:pb-14 lg:pt-[5.5rem]"
      aria-labelledby="isisel-hero-brand"
    >
      <HomeHeroBackdrop />

      <p
        className="home-hero-cities"
        aria-label={t("home.westCapitals")}
      >
        {["Dakar", "Bamako", "Banjul", "Accra", "Abidjan", "Lomé"].map((city) => (
          <span key={city}>{city}</span>
        ))}
      </p>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <h1
          id="isisel-hero-brand"
          data-hero-fade
          className="font-display text-[clamp(2.15rem,6.5vw,3.35rem)] leading-[1.04] tracking-[-0.03em]"
        >
          Isisel
        </h1>
        <p
          data-hero-fade
          className="home-hero-tagline mt-3 text-[10px] font-semibold uppercase tracking-[0.36em] sm:mt-3.5 sm:text-[11px]"
        >
          {t("home.tagline")}
        </p>

        <a
          data-hero-fade
          href={catalogOpen ? "#discover" : "#stays"}
          className="home-scroll-line mt-8 sm:mt-10"
          aria-label={
            catalogOpen ? t("home.browseStays") : t("home.comingSoon.kicker")
          }
          onClick={(event) => {
            const target = document.getElementById(
              catalogOpen ? "discover" : "stays",
            );
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <span className="home-scroll-line__track" aria-hidden>
            <span className="home-scroll-line__glide" />
          </span>
        </a>
      </div>
    </section>
  );
}
