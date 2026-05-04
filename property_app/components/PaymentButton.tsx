// components/PaymentButton.tsx
'use client';

import { useFlutterwavePayment } from '@/hooks/useFlutterwavePayment';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PaymentButtonProps {
  amount: number;
  currency: string;
  email: string;
  phone: string;
  name: string;
  bookingId: string;
}

export default function PaymentButton({
  amount,
  currency,
  email,
  phone,
  name,
  bookingId,
}: PaymentButtonProps) {
  const { initializePayment, isLoading } = useFlutterwavePayment();
  const router = useRouter();
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setError('');
    try {
      const response = await initializePayment({
        amount,
        currency,
        email,
        phone_number: phone,
        name,
        bookingId,
      });

      // Redirect to Flutterwave checkout
      if (response.data?.link) {
        window.location.href = response.data.link;
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : `Pay ${currency} ${amount.toLocaleString()}`}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span>🔒 Secured by Flutterwave</span>
      </div>
    </div>
  );
}