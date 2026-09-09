"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Homepage discovery:
 * - searchExpanded: compact search pill vs expanded shell (map + widgets)
 * - filters drive map bounds query + property list
 */
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

const HomeDiscoveryContext = createContext(null);

export function HomeDiscoveryProvider({ children }) {
  const [filters, setFilters] = useState(emptyHomeFilters);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const syncUrl = useCallback((nextFilters, searched) => {
    if (typeof window === "undefined") return;
    const qs = filtersToQueryString(nextFilters || emptyHomeFilters());
    const path = searched
      ? qs
        ? `/?${qs}`
        : "/?discover=1"
      : "/";
    window.history.replaceState(window.history.state, "", path);
  }, []);

  const expandSearch = useCallback(() => setSearchExpanded(true), []);
  const collapseSearch = useCallback(() => setSearchExpanded(false), []);

  const applySearch = useCallback(
    (nextFilters) => {
      const merged = { ...emptyHomeFilters(), ...nextFilters };
      setFilters(merged);
      setHasSearched(true);
      setSearchExpanded(false);
      setSelectedPropertyId(null);
      syncUrl(merged, true);
    },
    [syncUrl],
  );

  const clearSearch = useCallback(() => {
    setFilters(emptyHomeFilters());
    setHasSearched(false);
    setSearchExpanded(false);
    setSelectedPropertyId(null);
    syncUrl(emptyHomeFilters(), false);
  }, [syncUrl]);

  const value = useMemo(
    () => ({
      filters,
      searchExpanded,
      hasSearched,
      selectedPropertyId,
      expandSearch,
      collapseSearch,
      applySearch,
      clearSearch,
      setFilters,
      setSelectedPropertyId,
      setSearchExpanded,
    }),
    [
      filters,
      searchExpanded,
      hasSearched,
      selectedPropertyId,
      expandSearch,
      collapseSearch,
      applySearch,
      clearSearch,
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

/** @deprecated — kept for any leftover imports during migration */
export const HOME_STAGE = { HERO: "hero", RESULTS: "results" };
