"use client";

import { useEffect } from "react";
import { Fraunces, Outfit } from "next/font/google";
import Lenis from "lenis";
import HomePortalHero from "./HomePortalHero";
import HomeSearchSection from "./HomeSearchSection";
import FoundingHostsHomeModal from "@/components/foundingHosts/FoundingHostsHomeModal";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-kama-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-kama-sans",
  display: "swap",
});

export default function HomeImmersive({
  children,
  foundingStats = null,
  catalogOpen = true,
}) {
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
        <HomePortalHero catalogOpen={catalogOpen} />
        {catalogOpen ? <HomeSearchSection /> : null}
        {children}
      </div>
      <FoundingHostsHomeModal stats={foundingStats} />
    </div>
  );
}
