"use client";
import React, { useState, useEffect } from "react";

const DateCurrencyUpdated = () => {
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const fetchDate = async () => {
      try {
        const currencyApi = "https://open.er-api.com/v6/latest/USD";
        const res = await fetch(currencyApi);
        const data = await res.json();
        // 1. CHECK FIRST: If key is missing, go straight to fallback
        if (!process.env.NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API) {
          console.warn("API Key is missing! Using open fallback API.");
          // open.er-api returns time_last_update_utc (string)
          setUpdatedAt(data.time_last_update_utc);
          return;
        }

        // 2. PRIMARY: If key exists, use CurrencyFreaks
        // const res = await fetch(
        //   `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${process.env.NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API}`
        // );

        // // 3. Handle specific API errors
        // if (!res.ok) {
        //   throw new Error(`CurrencyFreaks API Error: ${res.status}`);
        // }

        setUpdatedAt(data.time_last_update_utc);
      } catch (error) {
        console.error("Error fetching date:", error);
      }
    };

    fetchDate();
  }, []);

  if (!updatedAt) return null;

  return (
    <span className="text-xs block pt-1 text-gray-400">
      Rates updated: {new Date(updatedAt).toLocaleDateString()}
    </span>
  );
};

export default DateCurrencyUpdated;
