"use client";

import HomePortalSearch from "./HomePortalSearch";
import { useHomeDiscoveryOptional } from "./HomeDiscoveryContext";

export default function HomeSearchSection() {
  const discovery = useHomeDiscoveryOptional();

  return (
    <section
      id="search"
      className="home-search-band"
      aria-label="Search stays"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <HomePortalSearch
          onSearch={discovery?.enterResults}
          initialFilters={discovery?.filters}
        />
      </div>
    </section>
  );
}
