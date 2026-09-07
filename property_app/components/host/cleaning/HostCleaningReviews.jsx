"use client";

import { useEffect, useState } from "react";
import { formatYmd } from "@/utils/cleaners/status";

export default function HostCleaningReviews() {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    fetch("/api/host/cleaning/reviews")
      .then((res) => res.json())
      .then((json) => setReviews(json.reviews || []));
  }, []);

  if (!reviews) return <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>;
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6 text-sm text-[var(--kama-ink-muted)]">
        Reviews you leave after a completed cleaning will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review._id}
          className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4"
        >
          <p className="text-sm font-semibold">
            {review.cleaner?.name} · {review.overall}★
          </p>
          <p className="text-xs text-[var(--kama-ink-muted)]">
            {review.job?.propertyName} · {formatYmd(review.job?.scheduledDate)}
          </p>
          {review.text ? <p className="mt-2 text-sm">{review.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}
