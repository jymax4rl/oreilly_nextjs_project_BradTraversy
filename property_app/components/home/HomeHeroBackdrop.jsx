"use client";

import Image from "next/image";

/**
 * Full-bleed arrival photograph — no baked-in type. The picture is the hero.
 */
export default function HomeHeroBackdrop() {
  return (
    <div className="home-portal-bg home-portal-bg--photo" aria-hidden>
      <Image
        src="/home/hero-villa-4k.png"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={90}
        className="home-hero-photo"
      />
      <div className="home-hero-scrim" />
    </div>
  );
}
