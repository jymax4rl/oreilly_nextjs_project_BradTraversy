// hooks/useFlutterwavePayment.ts
import { useState } from "react";

interface PaymentConfig {
  amount: number;
  currency: string; // 'NGN', 'KES', 'GHS', 'ZAR', etc.
  email: string;
  phone_number: string;
  name: string;
  bookingId: string;
  payment_options?: string; // 'card,mobilemoney,ussd'
}

export function useFlutterwavePayment() {
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
