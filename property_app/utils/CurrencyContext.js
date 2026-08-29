"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchExchangeRates } from "./currencyUtils";

const STORAGE_KEY = "kama_currency_code";

const DEFAULT_RATES = { USD: 1 };

const CurrencyContext = createContext({
  currencyCode: "USD",
  setCurrencyCode: () => {},
  rates: DEFAULT_RATES,
  loading: false,
});

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState("USD");
  // Start with USD=1 so listing grids can SSR/hydrate immediately; live rates refresh in background.
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCurrencyCodeState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setCurrencyCode = (code) => {
    const normalized = String(code || "USD").trim().toUpperCase();
    setCurrencyCodeState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      try {
        const fetchedRates = await fetchExchangeRates();
        if (fetchedRates && typeof fetchedRates === "object") {
          setRates({ ...DEFAULT_RATES, ...fetchedRates });
        }
      } catch (error) {
        console.error("Failed to load rates", error);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ currencyCode, setCurrencyCode, rates, loading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  return (
    ctx || {
      currencyCode: "USD",
      setCurrencyCode: () => {},
      rates: DEFAULT_RATES,
      loading: false,
    }
  );
};
