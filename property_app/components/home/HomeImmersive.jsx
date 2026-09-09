"use client";

import { useEffect } from "react";
import { Fraunces, Outfit } from "next/font/google";
import Lenis from "lenis";
import HomePortalHero from "./HomePortalHero";
import HomeSearchSection from "./HomeSearchSection";
import HomeDiscoveryShell from "./HomeDiscoveryShell";
import {
  HomeDiscoveryProvider,
  useHomeDiscoveryOptional,
} from "./HomeDiscoveryContext";
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

function HomeLenis({ enabled }) {
  useEffect(() => {
    if (!enabled) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduce || mobile) return undefined;

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
  }, [enabled]);

  return null;
}

function HomeImmersiveInner({
  children,
  foundingStats = null,
  catalogOpen = true,
  seedProperties = [],
}) {
  const discovery = useHomeDiscoveryOptional();
  const resultsActive = Boolean(discovery?.isResults);

  return (
    <div
      className={`home-portal ${fraunces.variable} ${outfit.variable}${
        resultsActive ? " home-portal--discovery" : ""
      }`}
    >
      <HomeLenis enabled={!resultsActive} />
      <div className="home-portal-content">
        {catalogOpen ? (
          <HomeDiscoveryShell
            seedProperties={seedProperties}
            hero={<HomePortalHero catalogOpen={catalogOpen} />}
            search={<HomeSearchSection />}
            teaser={children}
          />
        ) : (
          <>
            <HomePortalHero catalogOpen={catalogOpen} />
            {children}
          </>
        )}
      </div>
      <FoundingHostsHomeModal stats={foundingStats} />
    </div>
  );
}

export default function HomeImmersive({
  children,
  foundingStats = null,
  catalogOpen = true,
  seedProperties = [],
}) {
  return (
    <HomeDiscoveryProvider>
      <HomeImmersiveInner
        foundingStats={foundingStats}
        catalogOpen={catalogOpen}
        seedProperties={seedProperties}
      >
        {children}
      </HomeImmersiveInner>
    </HomeDiscoveryProvider>
  );
}
