"use client";

import { useEffect } from "react";
import { Fraunces, Outfit } from "next/font/google";
import Lenis from "lenis";
import HomePortalHero from "./HomePortalHero";
import HomeSearchSection from "./HomeSearchSection";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-kama-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-kama-sans",
  display: "swap",
});

export default function HomeImmersive({ children }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduce || mobile) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.1,
    });

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className={`home-portal ${fraunces.variable} ${outfit.variable}`}>
      <div className="home-portal-content">
        <HomePortalHero />
        <HomeSearchSection />
        {children}
      </div>
    </div>
  );
}
