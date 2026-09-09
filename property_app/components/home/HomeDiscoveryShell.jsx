"use client";

import { useEffect, useRef } from "react";
import {
  emptyHomeFilters,
  useHomeDiscovery,
} from "@/components/home/HomeDiscoveryContext";
import HomeMapDiscovery from "@/components/home/HomeMapDiscovery";

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
 * Homepage composition:
 * NAV → HERO → MAP DISCOVERY (compact + overlapping search) → RESULTS
 */
export default function HomeDiscoveryShell({
  hero,
  seedProperties = [],
}) {
  const { applySearch } = useHomeDiscovery();
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const fromUrl = readFiltersFromUrl();
    if (!fromUrl) return;
    applySearch(fromUrl);
  }, [applySearch]);

  return (
    <>
      <div className="home-discovery-hero-slot">{hero}</div>
      <HomeMapDiscovery seedProperties={seedProperties} />
    </>
  );
}
