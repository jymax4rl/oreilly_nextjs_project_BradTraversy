"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import LiquidPortalBackground from "./LiquidPortalBackground";
import HomePortalSearch from "./HomePortalSearch";

/**
 * Brand-led hero: name is the primary signal (no oversized duplicate logo mark).
 * Search is the interaction; currency lives inside the search card.
 */
export default function HomePortalHero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-fade]",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
          ease: "power3.out",
          delay: 0.06,
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate flex min-h-[min(72dvh,680px)] flex-col items-center justify-center overflow-x-clip overflow-y-visible px-4 pb-10 pt-[4.75rem] sm:px-6 lg:min-h-[70dvh] lg:pb-12 lg:pt-28"
      aria-labelledby="kama-hero-brand"
    >
      <LiquidPortalBackground />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center lg:max-w-5xl">
        <h1
          id="kama-hero-brand"
          data-hero-fade
          className="font-display max-w-[16ch] text-[clamp(2.65rem,9vw,4.75rem)] leading-[1.02] tracking-[-0.03em] text-[var(--portal-ink)]"
        >
          Kama{" "}
          <span className="whitespace-nowrap font-[450] text-[0.72em] tracking-[-0.02em] text-[var(--portal-ink)]">
            Properties
          </span>
        </h1>

        <p
          data-hero-fade
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--portal-accent)] sm:mt-5 sm:text-[11px]"
        >
          African vacation rentals
        </p>

        <div data-hero-fade className="mt-12 w-full sm:mt-14">
          <HomePortalSearch />
        </div>

        <div data-hero-fade className="mt-10 sm:mt-12">
          <Link
            href="#stays"
            className="home-scroll-hint inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.26em] transition hover:text-[var(--portal-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--portal-accent)]"
          >
            Browse stays
            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
