"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Homepage UI stages (cinematic discovery, not separate pages):
 * - hero: photograph + large search + teaser stays
 * - results: compressed hero + compact search + list|map explore
 */
export const HOME_STAGE = {
  HERO: "hero",
  RESULTS: "results",
};

const HomeDiscoveryContext = createContext(null);

export function emptyHomeFilters() {
  return {
    location: "",
    type: "",
    minPrice: null,
    maxPrice: null,
    minBeds: null,
    minBaths: null,
    checkIn: "",
    checkOut: "",
  };
}

export function filtersToQueryString(filters) {
  const params = new URLSearchParams();
  if (filters.location?.trim()) params.set("location", filters.location.trim());
  if (filters.type && filters.type !== "All Properties") {
    params.set("type", filters.type);
  }
  if (filters.minPrice != null && filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.minBeds) params.set("minBeds", String(filters.minBeds));
  if (filters.minBaths) params.set("minBaths", String(filters.minBaths));
  if (filters.checkIn) params.set("checkIn", filters.checkIn);
  if (filters.checkOut) params.set("checkOut", filters.checkOut);
  return params.toString();
}

export function HomeDiscoveryProvider({ children }) {
  const [stage, setStage] = useState(HOME_STAGE.HERO);
  const [filters, setFilters] = useState(emptyHomeFilters);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const syncUrl = useCallback((nextFilters, nextStage) => {
    if (typeof window === "undefined") return;
    const qs = filtersToQueryString(nextFilters || emptyHomeFilters());
    const path =
      nextStage === HOME_STAGE.RESULTS
        ? qs
          ? `/?${qs}`
          : "/?discover=1"
        : "/";
    window.history.replaceState(window.history.state, "", path);
  }, []);

  const enterResults = useCallback(
    (nextFilters) => {
      const merged = { ...emptyHomeFilters(), ...nextFilters };
      setFilters(merged);
      setTransitioning(true);
      setStage(HOME_STAGE.RESULTS);
      syncUrl(merged, HOME_STAGE.RESULTS);
    },
    [syncUrl],
  );

  const resetToHero = useCallback(() => {
    setTransitioning(true);
    setSelectedPropertyId(null);
    setStage(HOME_STAGE.HERO);
    syncUrl(emptyHomeFilters(), HOME_STAGE.HERO);
  }, [syncUrl]);

  const markTransitionDone = useCallback(() => {
    setTransitioning(false);
  }, []);

  const value = useMemo(
    () => ({
      stage,
      filters,
      transitioning,
      selectedPropertyId,
      isResults: stage === HOME_STAGE.RESULTS,
      enterResults,
      resetToHero,
      setFilters,
      setSelectedPropertyId,
      markTransitionDone,
    }),
    [
      stage,
      filters,
      transitioning,
      selectedPropertyId,
      enterResults,
      resetToHero,
      markTransitionDone,
    ],
  );

  return (
    <HomeDiscoveryContext.Provider value={value}>
      {children}
    </HomeDiscoveryContext.Provider>
  );
}

export function useHomeDiscovery() {
  const ctx = useContext(HomeDiscoveryContext);
  if (!ctx) {
    throw new Error("useHomeDiscovery must be used within HomeDiscoveryProvider");
  }
  return ctx;
}

export function useHomeDiscoveryOptional() {
  return useContext(HomeDiscoveryContext);
}
