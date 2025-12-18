"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchExchangeRates } from "./currencyUtils";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

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
