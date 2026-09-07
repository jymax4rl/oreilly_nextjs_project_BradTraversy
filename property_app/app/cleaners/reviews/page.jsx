"use client";

import { useEffect, useState } from "react";

export default function CleanerReviewsPage() {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    fetch("/api/cleaners/reviews")
      .then((res) => res.json())
      .then((json) => setReviews(json.reviews || []));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Reviews</h1>
      {!reviews ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review._id} className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
              <p className="font-semibold">{review.overall}★</p>
              <p className="text-xs text-[var(--kama-ink-muted)]">{review.job?.propertyName}</p>
              {review.text ? <p className="mt-2 text-sm">{review.text}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
