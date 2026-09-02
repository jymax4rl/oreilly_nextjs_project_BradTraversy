"use client";

import HomePortalSearch from "./HomePortalSearch";

export default function HomeSearchSection() {
  return (
    <section
      id="search"
      className="home-search-band"
      aria-label="Search stays"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <HomePortalSearch />
      </div>
    </section>
  );
}
