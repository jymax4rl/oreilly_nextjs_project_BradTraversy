"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchExchangeRates } from "./currencyUtils";

const STORAGE_KEY = "kama_currency_code";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState("USD");
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

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
        setRates(fetchedRates || {});
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

export const useCurrency = () => useContext(CurrencyContext);
