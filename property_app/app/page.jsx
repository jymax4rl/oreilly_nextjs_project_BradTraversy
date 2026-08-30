import React from "react";
import HomeImmersive from "@/components/home/HomeImmersive";
import PropertiesPage from "./properties/page";

// Home embeds live listings; keep dynamic so Docker builds need no MONGODB_URI.
export const dynamic = "force-dynamic";

const HomePage = () => {
  return (
    <HomeImmersive>
      <div id="stays" className="home-listings-bridge relative z-[2]">
        <div className="mx-auto max-w-3xl px-5 pb-1 pt-5 text-center sm:px-6 sm:pt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--kama-accent)]">
            Stays
          </p>
          <h2 className="mt-2 text-[1.65rem] leading-snug text-[var(--kama-ink)] sm:text-3xl sm:text-4xl [font-family:var(--font-kama-display),Georgia,serif]">
            Places you can book tonight
          </h2>
        </div>
        <PropertiesPage hideSearchToolbar maxProperties={11} />
      </div>
    </HomeImmersive>
  );
};

export default HomePage;
