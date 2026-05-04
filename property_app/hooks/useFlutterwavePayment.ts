// hooks/useFlutterwavePayment.ts
import { useState } from "react";

interface PaymentConfig {
  amount: number | string;
  currency: string;
  email: string;
  phone_number: string;
  name: string;
  bookingId: string;
  country?: string;
  description?: string;
  property_id?: string;
  property_name?: string;
  host_id?: string;
  host_name?: string;
  host_email?: string;
}

export function useGeniusPayPayment() {
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = async (config: PaymentConfig) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      return data;
    } catch (error) {
      console.error("Payment initialization failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { initializePayment, isLoading };
}

// Backward-compatible export to avoid breaking existing imports.
export const useFlutterwavePayment = useGeniusPayPayment;
