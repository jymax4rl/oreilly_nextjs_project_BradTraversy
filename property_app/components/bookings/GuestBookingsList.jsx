"use client";

import { useRouter } from "next/navigation";
import BookingCard from "@/components/bookings/BookingCard";

/**
 * Client wrapper so cancel/modify can refresh the server-rendered list.
 */
export default function GuestBookingsList({ bookings }) {
  const router = useRouter();

  if (!bookings?.length) return null;

  return (
    <ul className="space-y-4">
      {bookings.map((booking) => (
        <li key={booking._id}>
          <BookingCard
            booking={booking}
            onChanged={() => router.refresh()}
          />
        </li>
      ))}
    </ul>
  );
}
